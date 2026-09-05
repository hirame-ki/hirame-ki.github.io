# 손펜 — UI/디자인 작업 안내서

이 문서는 **손펜의 UI와 디자인을 다시 작업할 사람에게 주는 계약서**입니다.
겉모습은 마음껏 바꿔도 되지만, 여기 적힌 이름들은 `app.js`가 직접 참조하므로
바꾸면 앱이 조용히 고장납니다.

---

## 0. 이 프로젝트가 동작하는 방식

- 빌드 도구 없음. `index.html`을 열면 그대로 실행됩니다.
- `app.js`는 **DOM을 JS로 생성**합니다. 종이(`.page`), 격자 칸(`.cell`), 4선 노트
  (`.line-row`)는 HTML에 없고 런타임에 만들어집니다.
- 설정 패널의 입력 요소는 **`id`로 찾아서** 값을 읽습니다.
  → 그래서 `id`와 일부 클래스명이 사실상 API입니다.

---

## 1. 건드려도 되는 것 / 안 되는 것

| | 자유롭게 | 유지 필수 |
|---|---|---|
| `index.html` | 태그 구조, 순서, 배치, 래퍼 추가, 문구, 아이콘 | 모든 `id`, `input`의 `name`/`value` |
| `styles.css` | 색, 타이포, 간격, 그림자, 애니메이션, 반응형 | 2·3·4장의 클래스명과 CSS 변수, `@media print`, mm 치수 |
| `fonts.js` | 테마 값 추가/수정, 이모지, 추천 문구 | 객체의 **키 이름**(`paper`, `grid`, `ink`, `border`, `borderColor`, `emoji`, `place`) |
| `app.js` | — | **읽기 전용 참고용. 수정하지 마세요.** |

---

## 2. 유지해야 하는 `id` 목록 (총 63개)

대부분 `app.js`가 `document.querySelector('#...')`로 찾습니다.
하나라도 사라지면 그 기능이 조용히 죽습니다.
(`#stage`, `#gridStyleOpts`는 지금은 CSS 훅으로만 쓰이지만 함께 유지하세요.)

### 상단바 · 레이아웃
```
btnWriteMode  btnPrint  btnPanel  panel  stage  pages
```

### 문구 탭
```
inputText  autoCorrect  btnCorrectNow  correctionReport
scriptMode  scriptHint  presetChips
repeat  repeatVal  ghostOpacity  opacityVal
firstSolid  fadeOut  showNumbers
```

### 격자 탭
```
gridStyleOpts  cols  colsVal  cellGap  gapVal
lineHeightMM  lineHVal  gridColor  inkColor
```

### 글씨체 탭
```
fontSearch  fontList  fontScale  fontScaleVal  fontWeight
```

### 디자인 탭
```
themeGrid  paperColor  borderStyle  borderColor
sheetTitle  showMeta  sheetFooter
emojiChips  emojiCustom  emojiPlace  emojiSize
imgUpload  imgPlace  imgSize  imgOpacity  btnImgClear
```

### 용지 탭
```
margin  marginVal  zoom  zoomVal  btnSave  btnReset
```

### 쓰기 모드 툴바
```
penBar  penColor  penWidth  btnEraser  btnUndo  btnClearInk  btnExitWrite
```

> `#printStyle`은 `app.js`가 `<head>`에 직접 만들어 넣는 `@page` 규칙용 태그입니다.
> HTML에 쓸 필요 없고, 지우지도 마세요.

### 값이 정해진 요소

이 세 가지는 **`value` 문자열까지** 그대로여야 합니다.

```html
<!-- 격자 종류 (라디오, name=gridStyle) -->
cross | cross-dot | mi | box | baseline | none

<!-- 용지 방향 (라디오, name=orient) -->
portrait | landscape

<!-- 셀렉트 옵션 -->
#scriptMode    : auto | ko | ja | zh | en
#fontWeight    : 300 | 400 | 500 | 700
#borderStyle   : none | thin | double | rounded | dashed | dots | wave | ribbon | corner
#emojiPlace    : corners | top | bottom | scatter | side
#imgPlace      : top-left | top-right | bottom-left | bottom-right | watermark | header
```

### 탭 전환 규칙

탭 버튼과 내용은 `data-` 속성으로 연결됩니다. 마크업을 바꿔도 이 짝은 유지하세요.

```html
<button class="tab" data-tab="text">…</button>
<section class="tabpage" data-page="text">…</section>
```
`app.js`가 `.tab` / `.tabpage`에 `.active` 클래스를 토글합니다.
탭 키: `text` `grid` `font` `design` `paper`

---

## 3. `app.js`가 생성하는 클래스 (CSS에서 이름 유지 필수)

HTML에는 없지만 런타임에 만들어집니다. **셀렉터 이름을 바꾸면 스타일이 안 먹습니다.**

### 종이
```
.pages            페이지 묶음 (미리보기 배율 transform 이 걸림)
.page             A4 한 장. .landscape 가 붙으면 가로
.page-inner       여백 안쪽 콘텐츠 영역
.frame            테두리 장식 전용 레이어
.sheet-head  .sheet-title  .sheet-meta  .sheet-foot
.sheet-body       격자/줄이 들어가는 곳
.deco  .deco .em  .deco-img     이모지·이미지 장식 레이어
.ink-canvas       필기 캔버스 (.page.writing 일 때만 입력 받음)
```

### 테두리 (9종) — `.page`에 함께 붙습니다
```
.b-none  .b-thin  .b-double  .b-rounded  .b-dashed
.b-dots  .b-wave  .b-ribbon  .b-corner
```

### 격자 (6종) — `.page`에 함께 붙습니다
```
.gs-cross  .gs-cross-dot  .gs-mi  .gs-box  .gs-baseline  .gs-none
```

### 칸 격자 (한·중·일)
```
.grid-row        한 줄
.rownum          줄 번호
.cell            한 글자 칸 (.blank = 빈 칸)
.cell .diag      米자 격자의 대각선 (gs-mi 일 때만 생성)
.cell .ch        글자 자체
.row-solid       진한 견본 줄
.row-ghost       흐린 따라쓰기 줄
```

### 4선 노트 (알파벳)
```
.line-row
.line-row .rules      선 4개를 담는 컨테이너
.rules i.r1           윗선
.rules i.r2           중간 점선 (x-height)
.rules i.r3           기준선 (baseline) — 굵게
.rules i.r4           아랫선 (descender)
.line-row .txt        글자
.line-row .lnum       줄 번호
```

> **주의 — 4선 노트의 비율.** `.txt`는 `bottom: calc(30% - .22em)`으로 기준선에
> 정확히 앉습니다. `r2 = 40%`, `r3 = 70%` 값과 한 세트로 계산된 수치이니
> 셋 중 하나만 바꾸면 글자가 선에서 떠 보입니다. 바꾸려면 셋을 같이 바꾸세요.

---

## 4. CSS 변수 (`app.js`가 `.page`에 직접 주입)

`page.style.setProperty()`로 넣습니다. **이름을 바꾸면 사용자 설정이 화면에 반영되지 않습니다.**

| 변수 | 값 | 쓰이는 곳 |
|---|---|---|
| `--paper` | 색 | 종이 바탕 |
| `--grid` | 색 | 격자선 · 4선 노트 선 |
| `--ink` | 색 | 연습 글씨 · 제목 · 이름/날짜 |
| `--bcol` | 색 | 테두리 장식 |
| `--pad` | mm | `.page-inner` 여백 |
| `--cellgap` | px | 칸 사이 간격 |
| `--ghost` | 0~1 | 따라쓰기 투명도 |
| `--practicefont` | font-family | 연습용 글씨체 |
| `--chweight` | 300~700 | 글자 굵기 |
| `--lineh` | mm | 4선 노트 줄 높이 |

인라인 스타일로 직접 지정되는 것 (CSS에서 덮어쓰지 마세요):
`.cell`의 `height`, `.cell .ch`의 `font-size`, `.line-row`의 `--linefont`.

패널 쪽 테마 변수(`:root`의 `--bg --panel --line --text --muted --accent --accent-soft`)는
**자유롭게 바꾸거나 새로 만들어도 됩니다.** JS가 읽지 않습니다.

---

## 5. 인쇄 — 절대 건드리지 말 것

```css
@media print { … }
```

- `.page`의 `width/height`가 `210mm × 297mm`(가로는 `297 × 210`)여야 A4에 정확히 맞습니다.
  **px로 바꾸면 안 됩니다.**
- `break-after: page`가 페이지를 나눕니다.
- `print-color-adjust: exact`가 배경색·격자를 인쇄에 살립니다.
- `app.js`가 `@page { size: A4 portrait|landscape; margin: 0 }`를 런타임에 주입합니다.
  CSS 파일에 `@page`를 따로 쓰면 충돌합니다.
- `.no-print` 클래스가 붙은 요소는 인쇄에서 숨겨집니다. 새로 만든 UI 요소가
  화면 전용이라면 이 클래스를 꼭 붙여주세요.

**페이지 수 계산이 CSS에 물려 있습니다.** `app.js`는 아래 값을 가정해 한 장에 몇 줄이
들어갈지 미리 계산합니다.

- 줄 간격 3mm (`rowGapMM`)
- 제목 13mm, 이름/날짜 9mm, 여유 5mm, 아래 문구 9mm
- `.frame` 안쪽 여백 6mm

머리말/꼬리말의 **높이를 크게 바꾸면 마지막 줄이 잘리거나 빈 공간이 생깁니다.**
크게 바꿔야 한다면 알려주세요 — `app.js`의 `headH`/`footH` 계산을 같이 고쳐야 합니다.

---

## 6. `fonts.js` — 테마·장식 데이터

디자인 확장은 대부분 여기서 끝납니다. 키 이름만 지키면 자유입니다.

```js
{ id:'cream',        // 고유값
  name:'크림 노트',   // 화면에 보이는 이름
  paper:'#fffdf7',   // → --paper
  grid:'#d8d2c4',    // → --grid
  ink:'#3a3a3a',     // → --ink
  border:'thin',     // 2장의 borderStyle 값 중 하나
  borderColor:'#d9c3a5',
  emoji:'✿ ❀ ✿',    // 공백으로 구분
  place:'top' }      // corners|top|bottom|scatter|side
```

새 테두리 스타일을 추가하려면 **세 곳**을 같이 손봐야 합니다.
1. `index.html`의 `#borderStyle`에 `<option>` 추가
2. `styles.css`에 `.b-<값> .frame { … }` 규칙 추가
3. (선택) `fonts.js`의 테마에서 사용

폰트 추가는 `index.html`의 Google Fonts `<link>`에 패밀리를 넣고
`fonts.js`의 `SONPEN_FONTS`에 항목을 추가합니다.
**흘림체(cursive/script)는 넣지 마세요.** 정자 연습이 목적인 앱입니다.

---

## 7. 디자인 방향 참고

지금 톤은 "따뜻한 크림색 문구점 노트"입니다. 유지하든 갈아엎든 자유지만,
아래는 기능상 지켜지면 좋은 것들입니다.

- **종이가 주인공.** 설정 패널은 조용해야 하고, 미리보기가 시선을 가져가야 합니다.
- **격자선은 연하게.** 진하면 인쇄했을 때 글씨보다 격자가 먼저 보입니다.
- **따라쓰기 글씨(`.row-ghost`)와 격자선의 명도가 비슷하면 안 됩니다.**
  글씨가 격자에 묻힙니다.
- **태블릿을 고려.** 쓰기 모드의 버튼은 손가락으로 눌리는 크기(최소 44px)로.
- 900px 미만에서 설정 패널이 전체화면 오버레이(`.panel.open`)로 바뀝니다.
  이 동작은 `#btnPanel`이 토글합니다.

---

## 8. 확인 체크리스트

작업 후 아래가 다 되는지 봐주세요.

- [ ] 5개 탭이 모두 전환된다
- [ ] 문구를 입력하면 0.5초 뒤 미리보기가 갱신된다
- [ ] 격자 6종이 각각 다르게 보인다 (특히 `미자 격자(米)`의 대각선)
- [ ] 영어를 입력하면 4선 노트로 바뀌고, 글자가 기준선 위에 앉는다
- [ ] 테마 10종을 눌렀을 때 종이색·격자색·테두리·이모지가 한꺼번에 바뀐다
- [ ] 테두리 9종이 각각 다르게 보인다
- [ ] A4 세로/가로 전환 시 종이 비율이 맞다
- [ ] 인쇄 미리보기에서 **배경색과 격자가 나온다**, UI는 안 나온다, 페이지가 잘리지 않는다
- [ ] 쓰기 모드에서 종이 위에 그려지고, 되돌리기/지우개가 된다
- [ ] `현재 설정 저장` 후 새로고침하면 설정이 남아 있다
