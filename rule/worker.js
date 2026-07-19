/**
 * 규정나침반 — NVIDIA API 중계 프록시 (Cloudflare Worker)
 *
 * 왜 필요한가:
 *   브라우저는 NVIDIA API(integrate.api.nvidia.com)를 직접 호출할 수 없습니다.
 *   NVIDIA 서버가 CORS 헤더를 주지 않아 브라우저가 응답을 차단하기 때문입니다.
 *   이 Worker가 사이에서 요청을 그대로 중계하고 CORS 헤더만 붙여 줍니다.
 *
 * 개인정보 원칙 (의도적으로 이렇게 설계됨):
 *   - 저장 안 함: KV/DB/캐시 등 어떤 저장소도 쓰지 않습니다.
 *   - 로그 안 함: API 키·요청 본문·응답을 어디에도 기록하지 않습니다.
 *   - 목적지 고정: 오직 NVIDIA로만 전달합니다 (임의 URL 중계 불가).
 *   - 경로 제한: 임베딩/채팅 엔드포인트만 허용합니다.
 *   즉, 키와 내용은 이 Worker를 "지나가기만" 하고 남지 않습니다.
 */

const NVIDIA_ORIGIN = "https://integrate.api.nvidia.com";

// 이 두 경로만 통과시킵니다. 그 외 요청은 거부.
const ALLOWED_PATHS = new Set([
  "/v1/embeddings",
  "/v1/chat/completions",
]);

function corsHeaders() {
  return {
    // 각 사용자가 자기 키를 들고 오므로 모든 출처에서의 호출을 허용합니다.
    // (credentials 모드가 아니므로 '*'로 충분하며 file:// 에서도 동작)
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request) {
    // 1) CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // 2) POST 만 허용
    if (request.method !== "POST") {
      return json(405, { error: "POST 요청만 허용됩니다." });
    }

    // 3) 경로 검증 (목적지·엔드포인트 고정)
    const url = new URL(request.url);
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return json(404, { error: "허용되지 않은 경로입니다." });
    }

    // 4) NVIDIA 로 그대로 중계 (Authorization·Content-Type만 전달, 나머지 헤더는 버림)
    const upstream = NVIDIA_ORIGIN + url.pathname;
    const auth = request.headers.get("Authorization") || "";
    const contentType = request.headers.get("Content-Type") || "application/json";

    let res;
    try {
      res = await fetch(upstream, {
        method: "POST",
        headers: { "Authorization": auth, "Content-Type": contentType },
        body: request.body,
      });
    } catch (e) {
      return json(502, { error: "NVIDIA 서버 연결에 실패했습니다." });
    }

    // 5) NVIDIA 응답을 그대로 돌려주되 CORS 헤더만 부착
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
    // 브라우저 캐시가 인증된 응답을 저장하지 않도록
    headers.set("Cache-Control", "no-store");

    return new Response(res.body, { status: res.status, headers });
  },
};

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
