/**
 * 규정나침반 · 생기부돋보기 — NVIDIA API 중계 프록시 (Cloudflare Worker)
 *
 * 왜 필요한가:
 *   브라우저는 NVIDIA API(integrate.api.nvidia.com)를 직접 호출할 수 없습니다.
 *   NVIDIA 서버가 CORS 헤더를 주지 않아 브라우저가 응답을 차단하기 때문입니다.
 *   이 Worker가 사이에서 요청을 그대로 중계하고 CORS 헤더만 붙여 줍니다.
 *
 * 2026-07-28 개정 — 응답이 중간에서 잘리던 문제
 *   예전에는 TransformStream을 만들어 업스트림 응답을 **한 덩어리씩 손으로 옮겨 적고**,
 *   그동안 5초마다 keep-alive 주석을 끼워 넣었습니다(524 방지 목적).
 *   그런데 토큰 하나하나마다 JS가 개입하다 보니 Worker의 CPU 시간을 많이 써서,
 *   답변이 길어지면 실행 도중 잘려 나갔습니다. 증상은 이랬습니다:
 *     · 같은 요청을 세 번 보내면 두 번은 정상(404자·finish=stop), 한 번은 118자에서 뚝 끊김
 *     · 교정본 JSON이 반 토막 나서 클라이언트가 파싱에 실패
 *     · 실패가 조용히 "지적 0건"으로 보여 "AI가 맞춤법을 못 잡는다"로 느껴짐
 *   이제 성공 응답은 **업스트림 본문을 그대로 흘려보냅니다**(res.body 그대로 반환).
 *   Cloudflare가 바이트를 그냥 통과시키므로 JS가 토큰마다 개입하지 않고,
 *   따라서 CPU 한도에 걸려 잘릴 일이 없습니다.
 *
 *   첫 토큰까지 오래 걸리는 문제는 클라이언트가 맡습니다 —
 *   두 앱 모두 30초 안에 첫 글자가 없으면 다음 모델로 넘어갑니다(AI_FIRST_TOKEN_MS).
 *   그래서 여기서 keep-alive를 흘려 연결을 붙잡아 둘 이유가 없어졌습니다.
 *
 * 개인정보 원칙:
 *   저장 안 함 / 로그 안 함 / 목적지 NVIDIA 고정 / 허용 경로 제한.
 *   키·내용은 이 Worker를 "지나가기만" 하고 남지 않습니다.
 */

const NVIDIA_ORIGIN = "https://integrate.api.nvidia.com";
const CHAT_PATH = "/v1/chat/completions";
const ALLOWED_PATHS = new Set(["/v1/embeddings", CHAT_PATH]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

/** 오류를 SSE 한 줄로 돌려준다.
 *  채팅 경로는 스트리밍이라 클라이언트가 `data:` 줄만 읽는다. 오류도 같은 모양으로 보내야
 *  양쪽 앱(mirror·rule)이 지금 코드 그대로 사유를 읽어 화면에 띄울 수 있다. */
function sseError(status, message) {
  const body = "data: " + JSON.stringify({ error: { status, message } }) + "\n\n";
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", ...corsHeaders() },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json(405, { error: "POST 요청만 허용됩니다." });
    }

    const url = new URL(request.url);
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return json(404, { error: "허용되지 않은 경로입니다." });
    }

    const auth = request.headers.get("Authorization") || "";
    const contentType = request.headers.get("Content-Type") || "application/json";
    const upstreamUrl = NVIDIA_ORIGIN + url.pathname;

    // 본문을 한 번 읽어 둔다 — 재시도할 때 같은 내용을 다시 보내야 하기 때문
    const bodyText = await request.text();
    const fwd = () => fetch(upstreamUrl, {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": contentType },
      body: bodyText,
    });

    // 429(한도)·일시적 5xx는 여기서 최대 3회까지 다시 시도한다.
    // 헤더를 받기까지만 기다리는 것이라 본문 스트리밍에는 영향이 없다.
    let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fwd();
      } catch (e) {
        if (attempt >= 2) {
          const msg = "NVIDIA 서버 연결에 실패했습니다.";
          return url.pathname === CHAT_PATH ? sseError(502, msg) : json(502, { error: msg });
        }
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      break;
    }

    // 오류 응답 — 채팅 경로는 SSE 모양으로, 그 밖은 그대로 돌려준다
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      return url.pathname === CHAT_PATH
        ? sseError(res.status, text)
        : new Response(text, { status: res.status, headers: passHeaders(res) });
    }

    /* 성공 — 업스트림 본문을 **그대로** 흘려보낸다.
       여기서 스트림을 손으로 옮겨 적지 않는 것이 이 파일의 핵심이다(위 개정 메모 참고). */
    return new Response(res.body, { status: 200, headers: passHeaders(res) });
  },
};

// 스트림과 어긋날 수 있는 인코딩/길이 헤더는 제외하고 CORS만 부착
function passHeaders(res) {
  const headers = new Headers();
  res.headers.forEach((v, k) => {
    const kl = k.toLowerCase();
    if (kl === "content-encoding" || kl === "content-length" || kl === "transfer-encoding") return;
    headers.set(k, v);
  });
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  headers.set("Cache-Control", "no-store");
  return headers;
}
