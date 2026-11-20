# 슬라이드 엔진 (Slide Engine)

AI가 만든 수업 슬라이드(HTML)가 불러 쓰는 엔진이다. 디자인·모션·발표 기능은 엔진이 책임지고, AI는 구조와 내용, 테마 변수만 쓴다.
명세는 `docs/03_OUTPUT_TEMPLATES.md` §9, 옵션과의 대응은 `docs/02_OPTIONS.md`.

## 파일

| 파일 | 내용 |
|---|---|
| `slide-engine.css` | 레이아웃 24종, 위젯, 모션, 장식 7종, 인쇄 스타일 |
| `slide-engine.js` | 화면 맞춤, 이동·전환, 위젯, 발표 기능, 아이콘 |
| `themes/{이름}.css` | 테마 팩 8종 (v1.1.0부터). 색·글꼴·표지 구성·장식·모션이 든 완성된 디자인 |
| `../samples/reference-deck.html` | 레퍼런스 덱. 모든 레이아웃·위젯 확인용이자 웹앱 미리보기의 원본 |

크기: CSS 약 56KB + JS 약 64KB (압축 전, 목표 125KB 이하). 테마 팩은 하나에 7~10KB이고 쓰는 것 하나만 불러온다.

## 불러오는 주소

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hirame-ki/slide-engine@v1.2.0/engine/slide-engine.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hirame-ki/slide-engine@v1.2.0/engine/themes/studio.css">   <!-- 테마 팩을 쓸 때만 -->
<script src="https://cdn.jsdelivr.net/gh/hirame-ki/slide-engine@v1.2.0/engine/slide-engine.js"></script>
```


- 저장소 `hirame-ki/slide-engine`에 `engine/`과 `samples/` 폴더를 그대로 올린다 (GitHub 웹에서 파일 끌어다 놓기).
- 태그는 GitHub 웹의 **Releases → Draft a new release**에서 `v1.0.0`으로 만든다. 태그가 있어야 위 주소가 열린다.
- 웹앱(`index.html`)의 `ENGINE_REPO`, `ENGINE_TAG` 두 값이 이 주소를 만든다. 엔진을 고쳐 새 태그를 만들면 `ENGINE_TAG`도 함께 바꾼다.
- 한 번 만든 태그의 파일은 바꾸지 않는다 (이미 만든 슬라이드가 그 주소를 쓰고 있다). 고치면 새 태그를 만든다.

## 기본 구조

```html
<main class="deck" data-ratio="16:9" data-size="l" data-motion="subtle" data-features="stagger draw pen zoom edit overview help progress"
  data-head-font="pretendard" data-deco="dots">
  <section class="slide layout-cover">
    <p class="kicker">과목 · 단원</p>
    <h1>수업 제목</h1>
    <aside class="notes">발표자 노트</aside>
  </section>
</main>
```

- 테마는 `:root`의 변수 8개(`--bg` `--surface` `--ink` `--ink-2` `--accent` `--accent-ink` `--accent-2` `--radius`)로 정한다.
- `<main>` 속성과 장 안에서 쓰는 표시는 `docs/03_OUTPUT_TEMPLATES.md` §9-2 표와 같다.
- `data-features`가 아예 없으면 `stagger draw pen zoom edit overview help progress`로 본다.

## 테마 팩 (v1.1.0)

```html
<link rel="stylesheet" href="…/engine/slide-engine.css">
<link rel="stylesheet" href="…/engine/themes/pop.css">
…
<main class="deck" data-theme="pop" data-ratio="16:9" data-motion="subtle" data-features="stagger draw …">
```

| 값 | 이름 | 제목 등장 | 전환 | 배경 입자 |
|---|---|---|---|---|
| `studio` | 스튜디오 | mask | wipe | – |
| `magazine` | 매거진 | blur | fade | – |
| `chalk` | 칠판 | write | wipe | dust |
| `pop` | 팝 | pop | curtain | – (정답 축하) |
| `note` | 노트 | write | cover | – |
| `cosmos` | 밤하늘 | chars | zoom | stars |
| `retro` | 레트로 | mask | curtain | – |
| `botanic` | 보태니컬 | blur | fade | petals |

- 테마 CSS 파일 이름과 `data-theme` 값은 같아야 한다. 테마 CSS 줄이 없으면 엔진이 자기 주소 옆의 `themes/{이름}.css`를 불러온다.
- `data-theme`이 있으면 `data-deco`는 무시한다. `data-head-font`를 적으면 테마의 제목 글꼴 대신 그 글꼴을 쓴다.
- `data-enter` · `data-transition` · `data-bg-motion`을 적으면 그 값이 테마의 모션보다 앞선다. 적지 않으면 테마가 정한 모션이 나온다.
- 색 바꾸기: 테마 CSS 다음의 `<style>`에서 `:root` 변수 8개(`--bg` `--surface` `--ink` `--ink-2` `--accent` `--accent-ink` `--accent-2` `--on-accent`)를 덮어쓴다. 구성과 모션은 그대로 두고 색만 바뀐다.
- 엔진은 장마다 `<div class="se-deco"><i>×6</i></div>`를 넣고 테마가 그 여섯 칸으로 장식을 그린다. 저장한 파일에는 남지 않는다.
- 새 테마를 만들 때: `[data-theme=이름]{--t-name:이름; --t-title:…; --t-transition:…; --t-particles:…}`를 꼭 넣는다 (`--t-name`으로 테마 CSS가 불러와졌는지 확인한다). 움직임은 `.se-m[data-theme=이름] .slide.is-active …`에만 건다 (`se-m`은 모션이 켜져 있을 때만 붙는다).
- 확인: `samples/reference-deck.html?theme=pop` (오른쪽 위 버튼으로도 바꿀 수 있다).
- 글꼴: 매거진 Hahmlet, 칠판·노트 Gaegu, 팝 Bagel Fat One, 레트로 Do Hyeon, 보태니컬 Gowun Batang (모두 Google Fonts, 테마 CSS가 불러온다).

## 명세에 더한 것 (구현하면서 정한 것)

| 항목 | 내용 |
|---|---|
| 큰 숫자 단위 | `<span class="count" data-to="97" data-unit="%">` — 단위를 작게 붙인다 |
| 그래프 강조 | `<div class="bar hl" …>` — 강조할 막대. 없으면 가장 큰 값을 강조한다. 단위는 `.chart`의 `data-unit` |
| 글 넘침 안전장치 | 한 장의 내용이 화면을 넘치면 그 장만 최대 80%까지 줄여 보여 준다 (잘림 방지) |
| 클릭으로 넘기기 | 마우스는 왼쪽 1/3 = 이전, 나머지 = 다음. 터치는 왼쪽·오른쪽 1/3, 가운데는 도구 막대 |
| 도구 막대 | 키보드가 없는 전자칠판용. 마우스를 움직이거나 가운데를 누르면 왼쪽 아래에 나온다 |
| 한글 입력 상태 | 단축키는 자판 위치(`code`)로 읽어서 한/영 상태와 상관없이 동작한다 |
| 사진 줄이기 | 600KB가 넘는 사진은 긴 쪽 1920px JPEG로 줄여 넣는다 (저장 파일이 커지지 않게) |
| 사진 찾기 (v1.2.0) | 사진 칸의 [사진 찾기]를 누르면 위키미디어 공용(자유 이용 사진)에서 찾는다. 처음 낱말은 `data-hint`의 영어 부분. 고른 사진은 1280px로 받아 파일 안에 담고, `<figure data-credit="사진: 작가 · 라이선스 · Wikimedia Commons">`로 출처를 적어 칸 구석에 보여 준다. 찾을 낱말은 사용자의 브라우저에서 commons.wikimedia.org로 바로 간다(다른 곳으로 보내지 않는다). 끄려면 `.deck`에 `data-photo-search="off"` |
| 사진 출처 | `<figure class="img-slot" data-credit="…">` — 사진 칸 구석에 작게 보인다. 사진을 지우거나 내 사진으로 바꾸면 사라진다 |
| 바깥에서 쓰는 함수 | `SlideEngine.go(n)` `next()` `prev()` `toggle('pen'…)` `html()` `refresh()` `index` `total` |

## 밖에서 불러오는 것 (모두 버전 고정, 쓸 때만)

| 무엇 | 주소 | 언제 |
|---|---|---|
| Pretendard 1.3.9 | cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9 | 항상 (없으면 시스템 글꼴) |
| 제목 글꼴 (Gowun Dodum, Jua, Noto Serif KR, Black Han Sans) | fonts.googleapis.com | `data-head-font`가 그 값일 때 |
| Noto Sans JP / SC | fonts.googleapis.com | `data-lang-extra="ja"`/`"zh"` |
| KaTeX 0.16.11 | cdn.jsdelivr.net/npm/katex@0.16.11 | `data-features`에 `math` |
| qrcode-generator 1.4.4 | cdn.jsdelivr.net/npm/qrcode-generator@1.4.4 | `.qr`이 있을 때 (실패하면 주소를 글자로) |

## 아이콘

40종 + 화면용 6종. 모두 이 엔진을 위해 24×24 선 아이콘으로 직접 그린 것이라 따로 밝힐 라이선스가 없다.
(명세는 Lucide·Tabler 중 하나를 쓰도록 했지만, 경로를 옮겨 적는 과정의 오류와 고지 의무를 피하려고 직접 그렸다.)
이름: `book` `pencil` `bulb` `question` `check` `x` `clock` `users` `user` `chat` `globe` `map` `calendar` `star` `heart` `flag` `target` `chart` `search` `camera` `music` `film` `home` `leaf` `sun` `cloud` `water` `fire` `school` `trophy` `puzzle` `key` `link` `list` `arrow-right` `quote` `info` `alert` `gift` `scale`

## 필요한 브라우저

2023년 이후의 Chrome·Edge·웨일·Safari. CSS `color-mix()`, `:has()`, 개별 변형 속성(`scale`, `translate`), `zoom`을 쓴다.
'이어지는 전환(morph)'은 View Transitions를 지원하는 브라우저에서만 되고, 아니면 페이드로 바뀐다.

## 버전 기록

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1.0.0 | 2026-11-20 | 첫 버전 |
| v1.1.0 | 2026-11-20 | 테마 팩 8종(`data-theme`, `themes/*.css`), 장식 칸, 큰 제목 등장 효과 5종, 전환 4종 추가(wipe·iris·cover·curtain), 배경 입자 5종 추가(stars·snow·petals·bubbles·confetti), 정답 축하 색종이, `--on-accent` 변수, `data-head-font="pretendard"` 규칙. 기존 파일은 그대로 동작한다 |
| v1.2.0 | 2026-11-20 | 사진 칸에 [사진 찾기](위키미디어 공용 검색 → 파일 안에 담기), 사진 출처 표시(`data-credit`), 빈 사진 칸 버튼 두 개([내 사진 고르기]·[사진 찾기]), 낮은 칸에서는 아이콘·검색어 숨김. |
| v1.0.1 | 2026-11-20 | 공개한 클릭 단계·빈칸 정답이 다른 장 위로 비쳐 보이던 문제 수정. 학습목표·요약·목차·퀴즈 보기 안에 `<mark>`·`<b>`를 넣으면 글자가 깨지던 문제 수정. blob 장식에서 질문 장의 물음표가 묻히던 문제 수정. 크기 맞춤 보강(ResizeObserver) |

## 라이선스

MIT
