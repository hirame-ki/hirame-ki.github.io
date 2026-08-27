# 규정나침반 배포 가이드

브라우저는 NVIDIA API를 직접 부를 수 없습니다(NVIDIA가 CORS를 막음). 그래서
`worker.js`(중계 프록시)를 한 번만 배포하고, `index.html`이 그 프록시를 바라보게
하면 끝입니다. **약 10~15분, 무료.**

> **이미 배포되어 운영 중입니다.** Worker 이름은 **`hirameki`**, 주소는
> `https://hirameki.esquire0.workers.dev` 입니다.
> **규정나침반과 생기부돋보기가 이 워커 하나를 함께 씁니다** — 그래서 `worker.js`를
> 고치면 두 앱이 동시에 영향을 받습니다.
> 아래 1단계는 **처음 배포할 때** 이야기이고, 코드만 고쳐 올릴 때는
> [기존 Worker 코드 교체](#기존-worker-코드-교체) 쪽을 보세요.

---

## 기존 Worker 코드 교체

`worker.js`를 수정했을 때 이 순서로 올립니다. 주소가 그대로라 `index.html`은 손댈 필요가 없습니다.

1. https://dash.cloudflare.com 로그인
2. 왼쪽 **Workers & Pages** → 목록에서 **`hirameki`** 클릭
3. 오른쪽 위 **Edit code**
4. 편집기의 기존 코드를 **전부 지우고** `worker.js` 내용 전체를 붙여넣기
5. **Deploy**

배포 확인: 브라우저에서 `https://hirameki.esquire0.workers.dev/v1/chat/completions` 를 그냥 열어
`{"error":"POST 요청만 허용됩니다."}` 가 보이면 정상입니다.

### 2026-07-28 개정 — 응답 잘림 수정

예전 `worker.js`는 업스트림 응답을 **토큰 하나하나 손으로 옮겨 적으면서** 5초마다
keep-alive 주석을 끼워 넣었습니다(524 방지 목적). 그런데 토큰마다 JS가 개입하다 보니
Worker CPU 시간을 많이 써서, 답변이 길어지면 실행 도중 잘려 나갔습니다.

| | 개정 전 | 개정 후 |
|---|---|---|
| 같은 요청 3회 | 444자 / **118자(잘림)** / 407자 | 412 / 413 / 405자 |
| `finish_reason` | 없음·`stop` 뒤섞임 | 매번 `stop` |
| 교정본 JSON | 3회 중 1회 깨짐 | 4회 모두 정상 |

증상은 앱에서 **"AI가 맞춤법을 못 잡는다"**(JSON이 반 토막 나 파싱 실패)와
**"결과가 들쭉날쭉"**(잘리는 지점이 매번 다름)으로 나타났습니다.
지금은 성공 응답을 `new Response(res.body, …)`로 **그대로 흘려보냅니다.**

---

## 1단계 — Cloudflare Worker 프록시 배포

프록시는 키·내용을 저장하거나 기록하지 않고 NVIDIA로 그대로 통과만 시킵니다
(`worker.js` 상단 주석 참고).

### 방법 A. 대시보드에서 복붙 (가장 쉬움)

1. https://dash.cloudflare.com 접속 → 무료 회원가입(신용카드 불필요)
2. 왼쪽 메뉴 **Workers & Pages** → **Create application** → **Create Worker**
3. 이름을 정합니다. 예: `regchart-proxy`
   → 배포 주소는 `https://regchart-proxy.<내계정>.workers.dev` 형태가 됩니다.
4. **Deploy** 눌러 기본 워커 생성 → **Edit code** 클릭
5. 편집기에 있던 기본 코드를 전부 지우고, 이 폴더의 **`worker.js` 내용 전체**를
   붙여넣습니다.
6. 오른쪽 위 **Deploy** 클릭.
7. 배포된 주소를 복사해 둡니다. (예: `https://regchart-proxy.abc123.workers.dev`)

### 방법 B. 명령줄(wrangler)에 익숙하다면

```bash
npm i -g wrangler
wrangler login
wrangler deploy worker.js --name regchart-proxy
```

배포가 끝나면 출력에 나온 `*.workers.dev` 주소를 복사해 둡니다.

---

## 2단계 — index.html이 프록시를 보도록 수정

`index.html`을 열어 아래 줄을 찾습니다(파일 상단 `<script>` 안, 316번째 줄 근처):

```js
const BASE = "https://YOUR-WORKER-NAME.workers.dev/v1";
```

여기의 주소를 **1단계에서 복사한 Worker 주소 + `/v1`** 로 바꿉니다:

```js
const BASE = "https://regchart-proxy.abc123.workers.dev/v1";
```

> ⚠ 끝에 `/v1`을 꼭 붙이세요. (프록시가 `/v1/embeddings`, `/v1/chat/completions`
> 경로만 허용하도록 되어 있습니다.)

저장하면 끝입니다.

---

## 3단계 — 확인

1. `index.html`을 브라우저에서 엽니다.
2. NVIDIA 키(`nvapi-...`)를 넣고 **연결**을 누릅니다.
3. "연결됨"이 뜨면 성공. 이제 문서를 올리고 질의할 수 있습니다.

여전히 "Failed to fetch"가 나온다면:
- `BASE` 주소 오타/`/v1` 누락 확인
- Worker가 실제로 Deploy 되었는지, 주소가 브라우저에서 열리는지 확인
  (그 주소를 그냥 열면 "POST 요청만 허용됩니다" 같은 JSON이 보이면 정상)
- 브라우저 F12 → Console 탭의 실제 오류 메시지 확인

---

## 배포 후 공유

`index.html` 파일 하나만 공유하면 됩니다(프록시 주소가 이미 안에 박혀 있으므로).
- 정적 호스팅에 올리기: Cloudflare Pages, GitHub Pages, Netlify 등 무료 서비스
- 또는 파일 자체를 전달 — 각 사용자는 자기 `nvapi-` 키만 넣으면 됩니다.

사용자별 키·문서·대화 기록은 각자 브라우저에만 남고, 서로 공유되지 않습니다.

---

## 개인정보 관련 고지 (사용자에게 안내할 내용)

- 키는 **각 사용자 브라우저**(localStorage)에만 저장됩니다.
- 올린 **문서 내용과 질문은 답변 생성을 위해 NVIDIA 서버로 전송**됩니다.
  → 개인정보·기밀 문서는 올리지 않도록 안내하세요.
- 중계 프록시는 키·내용을 **저장하거나 기록하지 않습니다**(`worker.js` 설계).
- 공용 PC에서는 사용 후 **해제** 버튼으로 키를 지우도록 안내하세요.
- NVIDIA의 무료 API 데이터 이용 약관도 함께 확인하시길 권장합니다.
