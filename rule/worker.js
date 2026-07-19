/**
 * 규정나침반 — NVIDIA API 중계 프록시 (Cloudflare Worker)
 *
 * 왜 필요한가:
 *   브라우저는 NVIDIA API(integrate.api.nvidia.com)를 직접 호출할 수 없습니다.
 *   NVIDIA 서버가 CORS 헤더를 주지 않아 브라우저가 응답을 차단하기 때문입니다.
 *   이 Worker가 사이에서 요청을 그대로 중계하고 CORS 헤더만 붙여 줍니다.
 *
 * 524(타임아웃) 방지:
 *   채팅 응답은 모델이 첫 토큰을 내기까지 오래 걸릴 수 있고, 그동안 아무 데이터도
 *   흐르지 않으면 Cloudflare가 연결을 끊고 524를 냅니다. 그래서 채팅 경로는
 *   즉시 스트리밍 응답을 반환하고, 첫 토큰이 올 때까지 5초마다 keep-alive 주석
 *   (": ..." — 클라이언트가 무시하는 SSE 코멘트)을 흘려 연결을 유지합니다.
 *   추가로 429/일시적 5xx는 프록시 안에서 자동 재시도합니다.
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
    const fwd = (body) => fetch(upstreamUrl, {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": contentType },
      body,
    });

    // ── 임베딩 등 비스트리밍 경로: 단순 통과 ──
    if (url.pathname !== CHAT_PATH) {
      let res;
      try { res = await fwd(request.body); }
      catch (e) { return json(502, { error: "NVIDIA 서버 연결에 실패했습니다." }); }
      return new Response(res.body, { status: res.status, headers: passHeaders(res) });
    }

    // ── 채팅 경로: keep-alive 스트리밍 ──
    const bodyText = await request.text();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const ka = enc.encode(": keep-alive\n\n");
    const KEEPALIVE_MS = 5000;

    const pump = async () => {
      try {
        // 1) 업스트림 헤더를 받을 때까지 — 진행하며 주기적으로 keep-alive.
        //    429/일시적 5xx는 최대 3회 재시도.
        let res = null, attempt = 0;
        let fetchP = fwd(bodyText);
        while (res === null) {
          const w = await Promise.race([
            fetchP.then((r) => ({ r }), (e) => ({ err: e })),
            sleep(KEEPALIVE_MS).then(() => ({ tick: 1 })),
          ]);
          if (w.tick) { await writer.write(ka); continue; }
          if (w.err) throw w.err;
          const r = w.r;
          if ((r.status === 429 || r.status >= 500) && attempt < 3) {
            attempt++;
            await writer.write(ka);
            await sleep(2000 * attempt);
            fetchP = fwd(bodyText);
            continue;
          }
          res = r;
        }

        // 2) 오류 응답이면 SSE 형태로 오류를 전달(클라이언트가 파싱)
        if (!res.ok) {
          const t = await res.text();
          await writeErr(writer, enc, res.status, t.slice(0, 200));
          return;
        }

        // 3) 본문 스트리밍 — read를 기다리는 동안에도 주기적으로 keep-alive
        const reader = res.body.getReader();
        let readP = reader.read();
        while (true) {
          const w = await Promise.race([
            readP.then((v) => ({ v }), (e) => ({ err: e })),
            sleep(KEEPALIVE_MS).then(() => ({ tick: 1 })),
          ]);
          if (w.tick) { await writer.write(ka); continue; }
          if (w.err) throw w.err;
          const { value, done } = w.v;
          if (done) break;
          await writer.write(value);
          readP = reader.read();
        }
      } catch (e) {
        try { await writeErr(writer, enc, 502, String((e && e.message) || e).slice(0, 200)); } catch (_) {}
      } finally {
        try { await writer.close(); } catch (_) {}
      }
    };

    const p = pump();
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);

    return new Response(readable, {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", ...corsHeaders() },
    });
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

function writeErr(writer, enc, status, message) {
  return writer.write(enc.encode("data: " + JSON.stringify({ error: { status, message } }) + "\n\n"));
}
