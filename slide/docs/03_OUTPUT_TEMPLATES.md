# 03. 출력 템플릿 · 슬라이드 디자인 규칙 · 엔진 명세

웹앱이 만들어 내는 것(스킬·프롬프트·옵션 한 줄)의 형태와, 그 결과로 AI가 만드는 슬라이드의 품질 기준을 정한다.
**품질의 원천은 세 가지다: ① 고정 규칙(§3, §5) ② 엔진이 주는 레이아웃(§9) ③ 출력 전 자체 검수(§5-9).**

---

## 1. 출력 개요

| 출력 | 만드는 곳 | 형태 |
|---|---|---|
| 스킬 | ③ 받기 > 스킬 | ZIP (AI별 구조, §2) |
| 프롬프트 | ③ 받기 > 프롬프트 | 복사용 텍스트 (§6) |
| 옵션 한 줄 | ③ 받기 + '이번 수업' 패널 | `[수업옵션] …` (§7) |
| 오프라인 파일 | ③ 받기 > 오프라인 파일로 바꾸기 | AI가 만든 HTML에 엔진을 넣은 파일 (§9-11) |

템플릿 문법: `{{키}}`는 값으로 바꾸고, `{{#키}} … {{/키}}`는 해당 옵션이 켜졌을 때만 넣는다. 빈 줄이 연속으로 남지 않게 정리한다.

---

## 2. 스킬 패키지 구조

### 2-1. Claude · ChatGPT용 `{name}.zip`

```
{name}/
├── SKILL.md
└── references/
    ├── design-rules.md      # §5 전체
    └── layouts.md           # §9-4에서 고른 레이아웃만 + 항상 포함 레이아웃
```

- Claude: "스킬 폴더가 들어 있는 ZIP"을 올리고, 폴더 이름과 스킬 이름이 같아야 한다 (06_SOURCES).
- ChatGPT: 같은 ZIP을 올린다 (06_SOURCES, 실제 업로드로 확정).

### 2-2. Gemini용 `{name}-gemini.zip` + 단일 파일

```
SKILL.md
references/design-rules.md
references/layouts.md
```

- Gemini는 SKILL.md 파일 하나, 또는 SKILL.md가 최상위 폴더에 있는 폴더·ZIP을 받는다 (06_SOURCES).
- 대안 [SKILL.md 한 파일로 받기]: references 내용을 SKILL.md 끝에 붙인 단일 파일 (파일 이름은 반드시 `SKILL.md`).
- **확인 필요**: 폴더가 한 겹 들어간 ZIP(2-1 구조)도 Gemini가 받는지 실제 업로드로 확인. 받으면 ZIP을 하나로 통일한다.

### 2-3. 공통

- 모든 파일 UTF-8, 줄바꿈 LF.
- SKILL.md 본문 500줄 이하 (넘으면 내용을 references로 옮긴다).
- 엔진 코드는 패키지에 넣지 않는다 (엔진은 jsDelivr에서 불러옴, 01 §8-1).

---

## 3. SKILL.md 템플릿

````markdown
---
name: {{name}}
description: "수업자료(글·PDF·이미지)로 교실 수업용 HTML 슬라이드를 만들 때 쓴다. 템플릿 이미지나 캔바·미리캔버스 링크가 함께 오면 그 색·글꼴 느낌·장식을 따라 전문 디자이너 수준으로 만든다. '수업 슬라이드', '수업 PPT', '발표 자료 만들어줘', '[수업옵션]'이 들어간 요청에 쓴다."
---

# 수업 슬라이드 제작

교실에서 바로 쓰는, 전문 디자이너가 만든 것 같은 HTML 슬라이드를 만든다.
디자인은 매번 '디자인 참조'를 따르고, 만드는 방법은 이 문서를 따른다.
디자인을 새로 그리지 않는다. 엔진이 주는 레이아웃을 고르고, 내용과 테마 변수만 채운다.

## 1. 입력 확인
- 수업자료: 꼭 필요하다. 없으면 한 번만 요청한다.
- 디자인 참조: 템플릿 이미지 · 캔바 링크 · 미리캔버스 링크 · 없음 (§3).
- 옵션 한 줄: `[수업옵션]`으로 시작하는 줄 (§2).
- 우선순위: 요청에서 직접 말한 것 > 옵션 한 줄 > 기본 설정.
- 빠진 정보는 한 번만 묻는다. 답이 없으면 기본 설정으로 진행하고, 첫 줄에 무엇을 가정했는지 적는다.

## 2. 기본 설정
{{settings}}

옵션 한 줄 읽기: `[수업옵션] 키=값 | 키=값` 형태다. 아는 키만 적용하고 모르는 키는 무시한다.
| 키 | 값 |
|---|---|
| 장수 | 자동 또는 숫자 |
| 시간 | 45분 · 50분 · 90분 |
| 참조 | 이미지 · 캔바 · 미리캔버스 · 없음 |
| 테마 | 자동 · 무작위 · 스튜디오 · 매거진 · 칠판 · 팝 · 노트 · 밤하늘 · 레트로 · 보태니컬 · 화이트 · 종이 · 블루그레이 · 그린 · 파스텔 |
| 템플릿 | 등록된 템플릿의 이름 (G6에 등록했을 때만) |
| 링크 | 캔바·미리캔버스 템플릿 주소. 그 디자인을 이번 수업의 디자인 참조로 쓴다 |
| 글양 | 키워드 · 짧은문장 · 설명형 |
| 모션 | 없음 · 은은 · 생동 |
| 전환 | 없음 · 페이드 · 밀기 · 확대 · 이어짐 |
| 활동 | 퀴즈 · 빈칸 · 타이머 · 뽑기 · 손들기 (쉼표로 여러 개) |
| 언어 | 한국어 · 자료언어 |
| 결과물 | HTML · 캔바 · 미리캔버스 |

## 3. 디자인 참조 처리
- 템플릿 이미지: 이미지에서 {{take}}을 읽어 테마를 정한다 (references/design-rules.md §2).
- 캔바 링크: 연결된 캔바 도구로 디자인을 열어 페이지 미리보기와 글을 확인한 뒤 테마를 정한다. canva.link 단축 링크는 먼저 전체 주소로 바꾼다.
- 미리캔버스 링크: 편집 링크 끝의 디자인 ID(…/v2/design2/{디자인ID})로, 연결된 미리캔버스 도구에서 디자인 정보와 페이지 미리보기를 확인한다.
- 링크를 열 수 없으면(도구가 없거나 권한이 없음): 추측해서 만들지 않는다. "템플릿의 표지와 본문 2~3장을 PNG로 올려 주세요"라고 요청한다. 사용자가 그냥 진행하라고 하면 참조가 없을 때처럼 테마를 정한다.
- 참조가 없으면 {{theme_rule}}. 옵션 한 줄에 테마가 있으면 그 테마를 쓴다. 고른 테마를 첫 줄에 알린다.
- 참조가 있으면 분위기가 가장 가까운 테마 팩을 바탕으로 고르고, 템플릿에서 읽은 색으로 테마의 색을 덮어쓴다 (references/design-rules.md §2). 가까운 테마 팩이 없으면 기본형 방식(색 7개 + `data-head-font` + `data-deco`)으로 만든다.
{{#my_templates}}- 등록된 템플릿: 요청이나 옵션 한 줄(`템플릿=이름`)에 아래 이름이 있으면 그 링크를 디자인 참조로 쓴다. 이름이 없으면 쓰지 않는다. (이름: 링크 목록){{/my_templates}}
- {{multi_rule}}
- 템플릿의 그림·사진·로고는 복제하지 않는다. 느낌만 테마 변수와 장식 CSS로 해석한다.
{{#contrast}}- 템플릿 색 그대로면 대비가 부족할 때, 글자용 색(`--ink`, `--accent-ink`)을 따로 조정한다.{{/contrast}}

## 4. 작업 순서
1. 자료 분석: 핵심 개념과 흐름을 뽑는다. {{frame_rule}}
2. 개요: 장마다 한 메시지로 '제목 · 레이아웃 · 핵심 내용' 목록을 만든다. 장 수는 옵션 한 줄의 장수를 따르고, 없으면 자료 양에 맞춘다.
3. 테마: §3에 따라 테마 팩을 고른다 (기본형이면 색 7개, 제목 글꼴, 모서리, 장식을 정한다).
4. 작성: §6 형식으로 HTML을 쓴다. 레이아웃 구조는 references/layouts.md를 그대로 쓴다.
5. 검수: references/design-rules.md §10 체크리스트를 모두 통과할 때까지 고친다.
6. 출력: 완성 HTML 파일 1개와 3줄 요약(장 수, 쓴 테마, 확인 필요 항목).

## 5. 글쓰기
- 한 장에 한 메시지. 제목은 2줄 이내.
- {{amount_rule}}
- {{tone_rule}}
- {{emphasis_rule}}
- {{lang_rule}}
- 수업자료에 없는 사실·수치·인용을 지어내지 않는다. 보충이 꼭 필요하면 노트에 '[확인 필요]'로 적는다.
- 꼭 넣을 슬라이드: {{required_slides}}
{{#think_rule}}- {{think_rule}}{{/think_rule}}
{{#time_rule}}- {{time_rule}}{{/time_rule}}

## 6. 출력 형식 (반드시 이대로)
```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>수업 제목</title>
<link rel="stylesheet" href="{{engine_css}}">
<style>
:root {
  --bg: #FFFFFF;          /* 배경 */
  --surface: #F3F4F1;     /* 카드·면 */
  --ink: #16181B;         /* 본문 글자 */
  --ink-2: #5B6168;       /* 보조 글자 */
  --accent: #FF5A36;      /* 강조 도형·형광펜 */
  --accent-ink: #C2361A;  /* 강조색 글자 (대비 4.5:1 이상) */
  --accent-2: #1E2A44;    /* 보조 강조 */
  --radius: 16px;         /* 0 · 8 · 16 · 24 · 999 중 하나 */
}
/* 템플릿 느낌을 살리는 장식 CSS (20줄 이내, 레이아웃을 새로 만들지 않음) */
</style>
</head>
<body>
<main class="deck" {{deck_attrs}}
  data-head-font="pretendard" data-deco="dots">
  <section class="slide layout-cover">
    <p class="kicker">과목 · 단원</p>
    <h1>수업 제목</h1>
    <p class="sub">한 줄 소개</p>
    <aside class="notes">말할 내용</aside>
  </section>
  <!-- 장마다 section 하나 -->
</main>
<script src="{{engine_js}}"></script>
</body>
</html>
```
- 엔진 주소와 `data-` 속성 이름은 바꾸지 않는다. `data-head-font`, `data-deco` 값만 테마에 맞게 고른다 (references/design-rules.md §2).
- **위 예시는 기본형 테마일 때의 모습이다.** G5가 자동·무작위·테마 팩이면 웹앱은 아래 '테마 팩 형식'으로 예시를 바꿔 넣고, 두 형식을 오가는 방법을 한 줄씩 덧붙인다:
  - 테마 팩 형식: 엔진 CSS 다음 줄에 `<link rel="stylesheet" href="{{engine_base}}/engine/themes/{이름}.css">`, `<style>`은 비워 두거나(템플릿 색을 따를 때만 `:root` 색 8개), `<main>`에 `data-theme="{이름}"`. `data-head-font`·`data-deco`는 넣지 않는다 (B7에서 글꼴을 고른 경우 `data-head-font`만 그대로 둔다).
  - 테마 팩 → 기본형: 테마 CSS 줄과 `data-theme`을 빼고 `:root` 변수 8개 + `data-head-font` + `data-deco`.
  - 기본형 → 테마 팩: `:root` 변수와 `data-head-font`·`data-deco`를 빼고 테마 CSS 줄과 `data-theme`을 넣는다.
- 장마다 `<section class="slide layout-이름">` 하나. 엔진 밖의 스크립트를 쓰지 않는다.
- 테마 `<style>`에는 `:root` 변수와 장식 CSS 20줄 이내만 쓴다.
- 파일 이름: `수업제목_slides.html`.

## 7. 레이아웃
쓸 수 있는 레이아웃: {{layouts}}. 구조와 글 양 제한은 references/layouts.md를 따른다.
- {{mix_rule}}
{{#title_center}}- 장 제목은 가운데 정렬한다 (`data-title="center"`).{{/title_center}}

## 8. 모션
{{motion_rules}}

## 9. 수업 활동
{{activity_rules}}

## 10. 발표·편의
{{presenter_rules}}

{{#subject_rules}}
## 11. 교과 특화
{{subject_rules}}
{{/subject_rules}}

{{#canva}}
## 12. 캔바에서 직접 수정
요청에 '캔바에서 고쳐줘', '템플릿 수정', '결과물=캔바'가 있을 때만 이 절차를 쓴다.
1. 링크의 디자인을 연결된 캔바 도구로 읽는다 (페이지 미리보기·글·발표자 노트).
2. {{canva_copy_rule}} {{canva_pages_rule}}
3. 페이지마다 글을 바꾼다. {{canva_overflow_rule}}
4. {{canva_photos_rule}}
{{#canva_notes_rule}}5. {{canva_notes_rule}}{{/canva_notes_rule}}
{{#canva_brandkit_rule}}6. {{canva_brandkit_rule}}{{/canva_brandkit_rule}}
7. 바꾼 결과를 미리 보여 주고, 사용자 확인을 받은 뒤 저장한다.
8. {{canva_export_rule}}
- 애니메이션은 넣지 않는다. 필요하면 캔바 편집기에서 직접 넣도록 안내한다.
{{/canva}}

{{#miri}}
## 13. 미리캔버스에서 직접 수정
요청에 '미리캔버스에서', '결과물=미리캔버스'가 있을 때만 이 절차를 쓴다.
1. {{miri_start_rule}}
2. {{miri_pages_rule}}
3. 바꾼 페이지의 미리보기를 확인해 글 넘침·겹침을 고친다.
4. {{miri_download_rule}}
- 애니메이션은 넣지 않는다.
{{/miri}}

## 14. 하지 않는 것
- 어두운 배경 위주(템플릿이 어두운 경우 제외), 보라·파랑 그라데이션, 유리 효과 남발, 네온 글씨
- 이모지 아이콘, 의미 없는 장식 아이콘, 클립아트
- 왼쪽에 굵은 색 테두리를 단 카드, 모든 장을 같은 카드 3개로 채우기
- 가운데 정렬 본문 문단, 화면 가장자리에 붙은 글, 글로 꽉 찬 장
- 'X가 아니라 Y다' 같은 과장 문구, 느낌표 남발

## 15. 끝난 뒤 안내 (짧게)
- 저장: {{save_hint}}
- 발표: 파일을 브라우저로 열고 F 전체 화면, → 다음, O 전체 보기, ? 단축키
{{#offline}}- 인터넷이 없는 교실이면, 웹앱의 [오프라인 파일로 바꾸기]에 이 파일을 넣어 다시 받는다.{{/offline}}
````

### 3-1. 템플릿 키 채우는 법

| 키 | 출처 |
|---|---|
| `name` | O5 |
| `settings` | 고른 옵션을 "- 항목: 값" 목록으로 (B·C·D·E·F·G·H·I·J). 사람이 읽기 쉽게 한국어로 |
| `take` | G2 목록을 '색, 글꼴 느낌…'처럼 이어 붙임 |
| `theme_rule` | G5 (자동 · 무작위 · 테마 팩 · 기본형에 따라 02 G5의 문구) |
| `my_templates` | G6에 `이름=링크`가 하나라도 있으면 목록 |
| `multi_rule` | G3 반영 문구 |
| `contrast` | G4 |
| `frame_rule` | A1 반영 문구 |
| `amount_rule` · `tone_rule` · `emphasis_rule` | B3 · B4 · B5 |
| `lang_rule` | O6 |
| `required_slides` | A2 |
| `think_rule` | F5 (넣지 않음이면 빈 값) |
| `time_rule` | A5가 '정하지 않음'이 아니면 반영 문구 |
| `engine_css` · `engine_js` | 엔진 jsDelivr 주소 (01 §8-1) |
| `deck_attrs` | B1·B2·B6·C3·D3·D4·D5·E1·E2·E5·E8·E10·H1·I8 → `data-…` 속성, 켜진 기능 → `data-features` (§9-2). '템플릿 따라가기'인 값은 넣지 않는다 (AI가 고름) |
| `layouts` · `mix_rule` · `title_center` | C1 · C2 · C3 |
| `motion_rules` | E 반영 문구 모음 (E1이 '없음'이면 "움직임을 넣지 않는다." 한 줄) |
| `activity_rules` | F 반영 문구 모음 |
| `presenter_rules` | I·J·D 반영 문구 모음 |
| `subject_rules` | H 반영 문구 모음 (모두 꺼져 있으면 빈 값 → 절 전체 생략) |
| `canva` · `canva_*` | O3에 캔바 포함 시 K 반영 문구 |
| `miri` · `miri_*` | O3에 미리캔버스 포함 시 L 반영 문구 |
| `save_hint` | AI별 (§6-3) |
| `offline` | O4 = 파일에 내장 |

---

## 4. references/layouts.md 만들기

- §9-4 레이아웃 목록에서 **항상 포함** 레이아웃과 C1에서 고른 레이아웃, 켜진 기능에 딸린 레이아웃(F5 → question, F6 → activity, F1 → exit)만 골라 넣는다.
- 레이아웃마다: 이름 · 언제 쓰나 · HTML 구조 · 글 양 제한 (§9-4 그대로).
- 맨 위에 한 줄: "여기 없는 레이아웃은 쓰지 않는다. 클래스 이름과 구조를 바꾸지 않는다."

---

## 5. references/design-rules.md (전문 디자이너 규칙)

아래 내용이 그대로 design-rules.md가 된다. 프롬프트에도 그대로 들어간다.
- 파일로 만들 때 번호는 `5-n` → `§n`으로 바꾼다 (5-2 → §2, 5-10 → §10).
- §3 자리에는 §10-1 내장 테마 표를, §2의 글꼴 언급 뒤에는 §10-2 글꼴 표를 넣는다 (design-rules.md 하나로 완결되게).

### 5-1. 원칙

1. **한 장 한 메시지.** 학생이 3초 안에 이 장의 요점을 말할 수 있어야 한다.
2. **위계.** 가장 중요한 것이 가장 크다. 크기 → 굵기 → 색 순서로 차이를 둔다.
3. **정렬.** 모든 요소는 그리드 선에 맞춘다. 대충 맞춘 요소가 하나도 없게.
4. **여백.** 빈 공간도 디자인이다. 화면을 채우려고 요소를 늘리지 않는다.
5. **일관성.** 같은 종류의 요소는 모든 장에서 같은 크기·위치·간격.
6. **절제.** 색·글꼴·강조·효과는 적을수록 고급스럽다.

### 5-2. 테마 정하기 (디자인 참조 → 변수)

- **색 7개**를 정한다.
  - `--bg`: 가장 넓게 쓰인 배경색
  - `--surface`: 카드·상자의 면 색 (배경과 살짝 다른 명도)
  - `--ink`: 본문 글자 (배경 대비 4.5:1 이상)
  - `--ink-2`: 보조 글자 (배경 대비 4.5:1 이상)
  - `--accent`: 가장 눈에 띄는 포인트 색 (도형·형광펜·진행 막대)
  - `--accent-ink`: 강조색을 글자로 쓸 때의 색 (배경 대비 4.5:1 이상이 되도록 명도를 낮춘 값)
  - `--accent-2`: 두 번째 포인트 색 (그래프 두 번째 계열, 보조 도형)
- **비율**: 배경 60 · 면과 글자 30 · 강조 10. 강조색이 화면의 10%를 넘지 않게 한다.
- **밝기**: 템플릿이 밝으면 밝게, 어두우면 템플릿을 따른다. 참조가 없을 때 어두운 배경을 고르지 않는다.
- **제목 글꼴** `data-head-font`: 템플릿 제목과 가장 가까운 느낌을 고른다 (§10-2). 본문은 Pretendard로 고정.
- **모서리** `--radius`: 템플릿 도형의 모서리에 맞춰 0 · 8 · 16 · 24 · 999 중 하나.
- **장식** `data-deco`: `none` · `dots` · `lines` · `blob` · `frame` · `paper` · `stripe` 중 템플릿과 가장 가까운 것. 더 필요하면 장식 CSS 20줄 이내로 추가한다. 장식은 글 뒤, 여백 영역에만 둔다.
- **대비 검증**: 본문 4.5:1, 44px 이상 제목 3:1. 미달이면 `--ink` 쪽 명도를 조정한다.

### 5-3. 테마 팩과 기본형 내장 테마

- design-rules.md §2는 '테마 팩' 표(§10-3: 테마 · 값 · 분위기 · 어울리는 수업 · 바탕)와 고르는 법, 템플릿 색 입히기(색 7개 + `--on-accent`, `--radius`는 쓰지 않음), '기본형'(§5-2의 변수 정하기) 순서로 쓴다.
- design-rules.md §3은 기본형 내장 테마 표(§10-1)다. 값을 그대로 쓴다.
- 어두운 테마(칠판·밤하늘)는 주제에 꼭 맞거나 사용자가 고른 경우에만 쓴다.

### 5-4. 글자

- 크기 (1920×1080 기준, 4:3도 같은 px):

| 쓰임 | 크기 | 굵기 | 줄 간격 |
|---|---|---|---|
| 표지 제목 | 120px | 800 | 1.1 |
| 한 문장 크게 · 질문 | 88px | 800 | 1.15 |
| 장 제목 | 60px | 700 | 1.2 |
| 카드·단계 제목 | 40px | 700 | 1.3 |
| 본문 | 32 · 36 · 44px (B2) | 400~500 | 1.5 |
| 캡션·출처·쪽 번호 | 24px | 400 | 1.4 |

- 자간: 제목 -0.03em, 본문 -0.01em.
- 한 줄 길이: 본문은 한 줄 32자 안팎을 넘기지 않는다. 길면 두 단으로 나누거나 장을 나눈다.
- 줄바꿈: 단어 단위(`keep-all`). 제목은 줄 길이를 고르게. 한두 글자만 남는 줄이 없게 문장을 다듬는다.
- 글꼴은 제목용·본문용 2종까지. 굵기는 3단계(400 · 600 · 800)까지.
- 표와 숫자는 고정폭 숫자.

### 5-5. 배치와 간격

- 안전 여백: 16:9는 좌우 120px · 위아래 96px, 4:3은 좌우 96px · 위아래 96px. 모든 글과 중요한 요소는 이 안에.
- 12단 그리드, 간격은 8의 배수 (8 · 16 · 24 · 32 · 48 · 64 · 96).
- 장 제목은 모든 장에서 같은 위치·크기.
- 기본은 왼쪽 정렬. 가운데 정렬은 표지·한 문장 크게·질문·섹션 구분에만.
- 관련된 것은 가깝게, 다른 묶음은 멀게 (묶음 안 간격 < 묶음 사이 간격).
- 글이 화면의 70%를 넘지 않게. 넘치면 장을 나눈다. 글자를 줄여 욱여넣지 않는다.

### 5-6. 사진·아이콘·도형

- 사진은 칸을 꽉 채우고(`cover`), 한 묶음 안에서 모양을 통일한다.
- 사진 위에 글을 올리면 사진을 어둡게 하거나 그라데이션을 깔고, 대비를 확인한다.
- 아이콘은 한 세트, 한 크기(48 또는 64px), 한 장에 4개 이하, 뜻이 있을 때만.
- 도형의 모서리는 `--radius`와 같게.

### 5-7. 데이터

- 숫자 하나는 '큰 숫자' 레이아웃으로: 큰 숫자 + 짧은 설명 + 출처.
- 그래프는 막대·비율만. 축 대신 값에 직접 이름표를 단다.
- 강조할 값만 `--accent`, 나머지는 `--ink-2` 계열.
- 출처가 없으면 '출처: [확인 필요]'.

### 5-8. 모션

- 뜻이 있는 움직임만: 등장(읽는 순서대로), 강조(핵심 하나), 전환(흐름 연결).
- 0.4~0.6초, 감속 곡선. 차례 등장 간격 0.08~0.12초. 한 장의 등장은 1초 안에 끝 (클릭 단계 제외).
- 한 장에 강조 모션은 한 종류.
- 배경 움직임은 표지·섹션 구분·질문 장에만.
- 동작 줄이기 설정을 존중하고, 1초에 3번 넘게 깜빡이는 효과는 쓰지 않는다.
- 테마 팩의 모션(제목 등장·화면 전환·배경 효과·정답 축하)은 엔진이 재생한다. 따로 만들지 않는다.

### 5-9. 하지 않는 것 (AI 티)

- 어두운 배경 + 네온·형광 글씨, 보라·파랑 그라데이션, 유리 효과 남발, 짙은 그림자
- 이모지 아이콘, 의미 없는 장식 아이콘, 클립아트
- 왼쪽에 굵은 색 테두리를 단 카드, 모든 카드에 아이콘 동그라미, 모든 장을 같은 카드 3개로
- 가운데 정렬 본문 문단, 화면 가장자리에 붙은 글, 두 단계 넘는 들여쓰기 목록
- 'X가 아니라 Y다', '~의 모든 것', '혁신적인' 같은 과장 문구, 느낌표 남발
- 글로 꽉 찬 장, 글자를 줄여 욱여넣기

### 5-10. 검수 체크리스트 (출력 전 모두 확인)

- [ ] 모든 글이 안전 여백 안에 있고, 상자 밖으로 넘치지 않는다
- [ ] 가장 작은 글자 24px 이상, 대비 기준 통과
- [ ] 장 제목 위치·크기가 모든 장에서 같다
- [ ] 한 장 한 메시지, 글 양 기준을 지켰다
- [ ] 색은 테마 변수만 썼다 (임의 색 없음)
- [ ] 글꼴 2종 이하, 강조 2곳 이하
- [ ] 같은 레이아웃이 3장 넘게 이어지지 않는다 ('다양하게'일 때)
- [ ] 사진 칸마다 대체 텍스트와 검색어가 있다
- [ ] 퀴즈·빈칸의 정답이 수업자료와 일치한다
- [ ] 지어낸 사실·수치가 없다 (필요한 곳은 '[확인 필요]')
- [ ] 엔진 주소와 `data-` 속성 이름이 그대로다
- [ ] 테마 팩을 썼다면 테마 CSS 파일 이름과 `data-theme` 값이 같다
- [ ] 5-9 금지 항목이 하나도 없다

---

## 6. 프롬프트 템플릿

### 6-1. 구성

```
[AI별 머리말]
아래 '수업 슬라이드 제작 규칙'대로 슬라이드를 만들어 주세요.
수업자료와 디자인 참조는 이 메시지 맨 아래에 있습니다.

# 수업 슬라이드 제작 규칙
(SKILL.md 본문 §1~§15. frontmatter는 뺀다.
 'references/design-rules.md §n' → '아래 [디자인 규칙] §n',
 'references/layouts.md' → '아래 [레이아웃]'으로 바꾼다.)

# 디자인 규칙
(§5 전체)

# 레이아웃
(§4 규칙으로 고른 레이아웃)

# 이번 수업
[수업옵션] …                 ← '이번 수업' 패널 값
수업자료: (여기에 붙여 넣거나 파일로 첨부)
디자인 참조: (템플릿 이미지를 첨부하거나 링크를 붙여 넣기)

[AI별 꼬리말]
```

- 받기 화면에 글자 수를 표시한다. 20,000자를 넘으면 "스킬로 받으면 매번 붙여 넣지 않아도 돼요" 안내를 띄운다.

### 6-2. AI별 머리말·꼬리말

| AI | 머리말 | 꼬리말 |
|---|---|---|
| Claude | (없음) | 완성되면 HTML 파일로 만들어 내려받을 수 있게 해 주세요. |
| ChatGPT | (없음) | 완성된 HTML 전체를 코드 블록 하나로 주세요. 미리보기로 확인한 뒤 복사해서 .html 파일로 저장할게요. |
| Gemini | (없음) | Canvas에서 HTML로 만들어 미리보기가 보이게 해 주세요. |

- Gemini는 붙여 넣기 전에 입력창의 Canvas를 켜도록 받기 화면에서 안내한다 (04 §4).

### 6-3. 저장 안내 `save_hint`

| AI | 문구 |
|---|---|
| Claude | 만들어진 파일의 다운로드 버튼으로 저장해요. |
| ChatGPT | 코드 블록의 미리보기로 확인한 뒤, 복사해서 메모장에 붙여 넣고 '수업제목.html'로 저장해요. |
| Gemini | Canvas 미리보기로 확인한 뒤, 코드를 복사해 '수업제목.html'로 저장해요. |

각 AI의 실제 버튼 이름은 04 문서와 실제 화면으로 확인 후 맞춘다.

---

## 7. 옵션 한 줄

- 형식: `[수업옵션] 키=값 | 키=값 …` (키·값 표는 §3 SKILL.md §2)
- 기본 설정과 다른 값, 그리고 범위가 `lesson`·`both`인 값만 넣는다. 다 같으면 `[수업옵션] 기본`.
- 예: `[수업옵션] 장수=12 | 시간=45분 | 참조=이미지 | 활동=퀴즈,타이머`
- '이번 수업' 패널: A4 · A5 · G1 · G5 · B3 · E1 · E5 · F(활동 켜기) · O6 · O3를 빠르게 바꾸는 작은 패널. 값이 바뀌면 한 줄이 즉시 갱신된다.

---

### 7-1. 이번 수업의 템플릿 주소 (③ 받기)

- ③ 받기의 '이번 수업 옵션 한 줄' 위에 '템플릿 주소' 칸을 둔다. 스킬·프롬프트 두 방식 모두에서 보인다.
- 캔바(`canva.com`·`canva.link`)나 미리캔버스(`miricanvas.com`) 주소면 옵션 한 줄에 `참조=캔바 | 링크=주소`가 들어간다. 프롬프트 방식에서는 맨 끝의 '디자인 참조:' 줄에도 주소가 들어간다.
- 다른 주소는 받지 않고 "템플릿 이미지를 올려 주세요"라고 안내한다. 주소는 저장하지 않는다 (공유 링크·최근 설정에 남지 않음).
- 주소가 있으면 커넥터 연결 안내를 함께 보여 준다. AI가 주소를 열지 못하면 §3 규칙대로 템플릿 이미지를 요청한다.
- 따라가는 것은 색과 분위기다. 배치와 움직임은 가장 가까운 테마 팩의 것을 쓴다 (템플릿의 그림·배치를 그대로 옮기지 않는다).

## 8. 검증 규칙

| 항목 | 규칙 | 오류 문구 |
|---|---|---|
| 스킬 이름 | 1~64자, 영어 소문자·숫자·하이픈만, 하이픈으로 시작·끝나거나 연속 금지 `^[a-z0-9]+(-[a-z0-9]+)*$` | 영어 소문자, 숫자, 하이픈(-)만 쓸 수 있어요. 예: lesson-slides |
| 금지 단어 | 이름에 `claude`, `anthropic` 포함 금지 | 'claude', 'anthropic'은 이름에 넣을 수 없어요 |
| 폴더 이름 | 스킬 이름과 같게 자동 생성 | — |
| 파일 이름 | 정확히 `SKILL.md` | — |
| description | 1~1,024자, `<` `>` 금지, 큰따옴표로 감싸고 안의 큰따옴표는 이스케이프 | 설명이 너무 길어요 (1,024자 이하) |
| 본문 길이 | SKILL.md 본문 500줄 이하 (경고) | 내용이 길어 일부를 참고 파일로 옮겼어요 |

근거: 06_SOURCES (Anthropic 스킬 작성 지침, Claude 업로드 오류 목록, Gemini 이름 규칙).

---

## 9. 슬라이드 엔진 명세

### 9-1. 파일과 버전

- `engine/slide-engine.css`, `engine/slide-engine.js` (+ 필요하면 `.min` 버전), 테마 팩 `engine/themes/{이름}.css` (v1.1.0부터)
- 주소: `https://cdn.jsdelivr.net/gh/{계정}/{저장소}@{태그}/engine/slide-engine.css` (js 동일)
- 태그는 `v1.0.0` 형식. 호환이 깨지면 메이저 버전을 올리고 이전 태그는 유지한다. 변경 기록은 `engine/README.md`.
- 크기 목표: CSS + JS 합쳐 압축 전 125KB 이하 (v1.1.0 실제 약 120KB). 테마 팩은 따로 불러오며 하나에 7~10KB. 선택 기능(KaTeX, QR)은 쓸 때만 고정 버전 CDN에서 불러온다.

### 9-2. HTML 계약

`<main class="deck">` 속성 (값은 02 옵션의 반영 항목):

| 속성 | 값 | 옵션 |
|---|---|---|
| `data-ratio` | `16:9` · `4:3` | B1 |
| `data-size` | `m` · `l` · `xl` | B2 |
| `data-space` | `loose` · `normal` · `tight` | B6 |
| `data-title` | `left` · `center` | C3 |
| `data-motion` | `none` · `subtle` · `lively` | E1 |
| `data-enter` | `rise` · `fade` · `blur` · `scale` · `mask` · `type` | E2 |
| `data-transition` | `none` · `fade` · `push` · `zoom` · `morph` | E5 |
| `data-speed` | `slow` · `normal` · `fast` | E10 |
| `data-bg-motion` | `none` · `flow` · `float` · `particles` | E8 |
| `data-img-filter` | `none` · `mono` · `duo` · `dim` | D4 |
| `data-img-shape` | `rect` · `round` · `circle` · `arch` | D3 |
| `data-icon` | `line` · `fill` | D5 |
| `data-footer` | `none` · `page` · `page-title` | I8 |
| `data-head-font` | §10-2 값 | B7 · 테마 |
| `data-deco` | `none` · `dots` · `lines` · `blob` · `frame` · `paper` · `stripe` | 기본형 테마 |
| `data-theme` | `studio` · `magazine` · `chalk` · `pop` · `note` · `cosmos` · `retro` · `botanic` (§10-3). 있으면 `data-deco`는 무시한다 | G5 · 테마 팩 |
| `data-lang-extra` | `ja` · `zh` (외국어 글꼴 추가) | H1 |
| `data-features` | 공백으로 구분: `stagger` `draw` `kenburns` `stage` `pen` `spotlight` `zoom` `edit` `overview` `help` `presenter` `progress` `hc` `math` `noprint` | E3 E7 E9 A3 F7 F8 F9 I3 I6 I7 I2 I9 J1 H3 I4 |

`<section class="slide layout-…">` 안에서 쓰는 것:

| 표시 | 뜻 |
|---|---|
| `class="step"` | 클릭할 때마다 하나씩 등장 (E4) |
| `data-stage="도입"` | 수업 단계 표시 (A3) |
| `data-morph="이름"` | 이어지는 전환에서 같은 요소로 연결 (E5 morph) |
| `<aside class="notes">` | 발표자 노트 (section 마지막 자식) |
| `<figure class="img-slot" data-hint="검색어"><img alt="…"></figure>` | 사진 칸 (img 없으면 빈 칸) |
| `<mark>`, `.em-color`, `.em-underline`, `<b>` | 강조 (B5) — `.draw`를 붙이면 그리는 모션 (E6) |
| `<span class="count" data-to="1234">` | 숫자 올라가기 (E6) |
| `<p class="words">` | 단어 하나씩 등장 (E6) |
| `<small class="credit">` | 출처 (D6) |
| `<i class="ico" data-i="이름"></i>` | 아이콘 (§9-7) |
| `<ruby>단어<rt>읽기</rt></ruby>` | 읽기 표기 (H1) |

### 9-3. 화면 맞춤과 조작

- 논리 크기 1920×1080 (4:3은 1440×1080)으로 그리고 화면에 맞게 비율 유지 확대·축소. 남는 부분은 `--bg`로 채운다.
- 단축키:

| 키 | 동작 |
|---|---|
| → · Space · PageDown · Enter | 다음 (클릭 단계 먼저) |
| ← · PageUp | 이전 |
| Home · End | 처음 · 끝 |
| 숫자 + Enter | 해당 장으로 |
| F | 전체 화면 |
| O | 전체 보기 (overview) |
| N | 발표자 노트 보기 |
| P | 발표자 화면 (presenter) |
| E | 편집 모드 (edit), Ctrl+S 저장 |
| D · C | 판서 펜 (pen) · 지우기 |
| L | 스포트라이트 (spotlight) |
| B · W | 검은 화면 · 흰 화면 |
| H | 고대비 (hc) |
| ? | 단축키 안내 (help) |
| Esc | 열린 것 닫기 |

- 터치: 좌우 밀기, 화면 왼쪽·오른쪽 1/3 탭.
- 주소 `#3` 같은 해시로 해당 장 열기. 마지막 장 기억은 sessionStorage (try/catch).
- 기능이 `data-features`에 없으면 그 단축키는 동작하지 않고 안내에도 나오지 않는다.

### 9-4. 레이아웃 (layouts.md의 원본)

모든 레이아웃은 엔진 CSS가 디자인을 책임진다. AI는 구조만 쓴다.

**항상 포함**

| 레이아웃 | 언제 | 구조 | 제한 |
|---|---|---|---|
| `layout-cover` 표지 | 첫 장 | `p.kicker` · `h1` · `p.sub` · (선택) `p.meta` · (선택) `figure.img-slot` | 제목 2줄 |
| `layout-section` 섹션 구분 | 큰 단원 시작 | `p.num`(01) · `h2` · `p.sub` | 제목 1줄 |
| `layout-goals` 학습목표 | A2 | `h2` · `ol.goals > li` | 3개 이하 |
| `layout-agenda` 목차 | A2 | `h2` · `ol.agenda > li` (현재 항목 `aria-current`) | 6개 이하 |
| `layout-summary` 핵심 요약 | A2 | `h2` · `ul.points > li` | 4개 이하 |
| `layout-exit` 형성평가 | A2·F1 | `h2` · `.quiz` 1~3개 | 3문항 이하 |
| `layout-next` 다음 차시 | A2 | `h2` · `p` | 2줄 |
| `layout-refs` 참고자료 | A2 | `h2` · `ul.refs > li` | 6개 이하 |

**고를 수 있음 (C1)**

| 레이아웃 | 언제 | 구조 | 제한 |
|---|---|---|---|
| `layout-statement` 한 문장 크게 | 핵심 주장·정의 | `p.big` · (선택) `p.by` | 40자 이하 |
| `layout-cards` 카드 | 나란한 2~4개 개념 | `h2` · `.cards > .card > (i.ico) h3 + p` | 카드 2~4개, 카드 제목 12자, 본문 2줄 |
| `layout-compare` 2단 비교 | A vs B | `h2` · `.cols > .col > h3 + ul` (선택 `.vs`) | 한쪽 3항목 |
| `layout-steps` 단계·과정 | 순서가 있는 과정 | `h2` · `ol.steps > li > h3 + p` | 3~5단계, 설명 1줄 |
| `layout-timeline` 연표 | 시간 순서 | `h2` · `ol.timeline > li > time + h3 + p` | 3~6개 |
| `layout-table` 표 | 여러 기준 비교 | `h2` · `table` (`thead` 첫 행) | 5행 × 4열 이하 |
| `layout-split` 사진+설명 | 사진이 중요한 설명 | `.media > figure.img-slot` · `.text > h2 + p/ul` · `data-side="left|right"` | 본문 4줄 |
| `layout-fullbleed` 전면 사진 | 분위기·장면 | `figure.img-slot.bg` · `.overlay > h2 + p` | 제목 1줄 + 1줄 |
| `layout-number` 큰 숫자 | 통계 1~3개 | `.stats > .stat > span.count + p.label` + `small.credit` | 3개 이하 |
| `layout-quote` 인용 | 인용문 | `blockquote > p + cite` | 3줄 |
| `layout-mindmap` 개념도 | 중심 개념과 하위 개념 | `.map > .center + .branch × 3~6` | 가지 6개 이하 |
| `layout-venn` 벤 다이어그램 | 공통점·차이점 | `.venn > .set.a + .set.b + .overlap` (각 `h3 + ul`) | 각 3항목 |
| `layout-question` 질문 | 생각해 보기·발문 | `p.q` · (선택) `p.hint` · (선택) `.timer` | 질문 2줄 |
| `layout-vocab` 용어 카드 | 어휘·용어 | `.vocab > .term + .meaning + .example` | 1장에 1~3개 |
| `layout-chart` 간단 그래프 | 수치 비교 | `h2` · `.chart[data-type="bar|ratio"] > .bar[data-value][data-label]` + `small.credit` | 6개 이하 |

**기능에 딸린 레이아웃**: `layout-activity` (F6: `h2` · `.activity > .role + .time + .output` · 선택 `.timer`), `section.handout` (I5).

엔진 CSS는 각 레이아웃을 `data-size`·`data-space`·`data-title`·`--radius`·`data-deco`에 맞춰 자동으로 조정한다. 레이아웃마다 레퍼런스 덱(§11)에서 5개 테마로 확인한다.

### 9-5. 모션 구현

- 등장(E2): 요소별 keyframes. 지속 0.5초 × 속도 배율(E10), 감속 곡선 `cubic-bezier(.2,.8,.2,1)`.
- 차례 등장(E3): 요소 순서대로 `--i`를 매겨 지연 0.08초 × i. 한 장 전체 1초 안에 끝나게 최대 지연을 제한.
- 클릭 단계(E4): `.step`을 순서대로 공개. 이전으로 가면 하나씩 숨김. 인쇄·전체 보기에서는 모두 보임.
- 화면 전환(E5): fade · push · zoom은 CSS. morph는 View Transitions API(`document.startViewTransition`)로 같은 `data-morph` 요소를 연결하고, 지원하지 않는 브라우저는 fade로 대체.
- 글자 강조(E6): 형광펜 = 배경 그라데이션 크기 0→100%, 밑줄 = 선 길이 0→100%, 카운트업 = 1초 동안 숫자 증가, 단어 하나씩 = 단어 단위 0.06초 간격.
- 선 그리기(E7): SVG `stroke-dasharray`/`dashoffset`, 연결된 상자가 나타난 뒤에 그려지도록 지연.
- 배경 움직임(E8): flow = 큰 그라데이션 천천히 이동(20초 이상 주기), float = 도형 3~5개 느린 이동, particles = 입자 30개 이하 캔버스. 본문 장에서는 끈다.
- 사진 확대(E9): 12초 동안 1.0→1.08배.
- 동작 줄이기(`prefers-reduced-motion: reduce`)이면 모든 움직임을 끄고 최종 상태를 바로 보여 준다. 깜빡임은 1초에 3번을 넘지 않는다.
- 테마 팩 (v1.1.0): `data-theme`이 있으면 엔진이 장마다 장식 칸 `<div class="se-deco"><i>×6</i></div>`를 넣고(저장 파일에는 남지 않음), 테마 CSS가 그 모양과 움직임을 정한다. 테마 CSS는 변수로 모션을 알린다.
  - `--t-title`: 표지·섹션·한 문장·질문 장의 큰 제목이 나타나는 방식. `mask`(단어가 아래에서 밀려 올라옴) · `chars`(글자 하나씩) · `pop`(단어가 튀어나옴) · `write`(왼쪽부터 써 나감) · `blur`(흐림에서 선명하게)
  - `--t-transition`: `data-transition`이 없을 때의 전환. 기존 값에 `wipe`(닦아내기) · `iris`(원이 열림) · `cover`(위로 덮기) · `curtain`(색 막 세 장이 지나감)이 더해졌다
  - `--t-particles`: `data-bg-motion`이 없을 때 표지·섹션·한 문장·질문 장의 배경 입자. `dust` · `stars` · `snow` · `petals` · `bubbles` · `confetti`
  - `--t-celebrate: 1`: 객관식·O·X 퀴즈를 맞히면 색종이가 터진다 (`data-motion="lively"`일 때도 터진다)
- 테마 CSS가 불러와지지 않았으면 엔진이 자기 주소 옆의 `themes/{이름}.css`를 불러온 뒤 시작한다.

### 9-6. 위젯 마크업과 동작

| 위젯 | 마크업 | 동작 |
|---|---|---|
| 퀴즈 (F1) | `<div class="quiz" data-answer="2"><p class="q">질문</p><ol class="opts"><li>…</li></ol><p class="why">해설</p></div>` · O·X는 `class="quiz ox" data-answer="O"` · 초성은 `class="quiz initials" data-answer="정답" data-hint="ㅈㄷ"` | 보기 클릭 → 정답은 ✓·색·굵게, 오답은 ✕ 표시, 해설 공개. 숫자 키 1~4로 선택. [다시] 버튼 |
| 빈칸 (F2) | `<span class="blank" data-answer="광합성"></span>` | 클릭·Enter로 정답 공개/숨김 |
| 타이머 (F3) | `<div class="timer" data-sec="180"></div>` | 큰 mm:ss, 시작·멈춤·다시, 프리셋(1·3·5·10분). 끝나면 1초에 1번 이하로 은은하게 맥박 + "끝!" (소리 없음) |
| 뽑기 (F4) | `<div class="picker" data-min="1" data-max="30"></div>` | [뽑기] → 1.2초 이하 슬롯 효과 → 번호. 뽑힌 번호 제외, [초기화] |
| 손들기 (F10) | `<div class="tally" data-options="찬성,반대"></div>` | 선택지별 +/− 버튼, 막대 그래프 |
| QR (F11) | `<div class="qr" data-url="https://…"></div>` | 고정 버전 QR 라이브러리를 그때만 불러와 그림. 실패하면 주소를 글자로 표시 |
| 사진 칸 (D1) | §9-2 | [내 사진 고르기] → 파일 선택, 끌어다 놓기, 붙여 넣기. [사진 찾기](v1.2.0) → 위키미디어 공용 검색, 고르면 1280px 사진을 파일 안에 담고 `data-credit`에 출처를 적어 칸 구석에 보여 준다. 빈 칸은 점선 + 아이콘 + 검색어 표시. 넣은 뒤엔 [찾기]·[바꾸기]·[지우기] |
| 편집 (I3) | `data-features`의 `edit` | E 키 → 글자 요소 바로 고치기 + 상단 막대 [저장]·[취소]. 저장 = 엔진이 넣은 표시를 지운 깨끗한 HTML(사진 포함)을 내려받기 |
| 판서 (F7) | `pen` | D 키 → 현재 장 위 캔버스. 색 3개(`--ink`, `--accent`, 빨강), 굵기 2단계, C 지우기. 장마다 따로 기억 |
| 스포트라이트 (F8) | `spotlight` | L 키 → 포인터 주변만 밝게 |
| 크게 보기 (F9) | `zoom` | 사진·표 클릭 → 화면 가득, Esc 닫기 |
| 전체 보기 (I6) | `overview` | O 키 → 모든 장 축소 격자, 클릭으로 이동 |
| 발표자 화면 (I2) | `presenter` | P 키 → 새 창: 현재·다음 장, 노트, 경과 시간. 두 창 동기화 |
| 진행 막대 (I9) | `progress` | 화면 맨 아래 4px `--accent` 막대 |
| 쪽 번호 (I8) | `data-footer` | 오른쪽 아래 24px |
| 단계 표시 (A3) | `stage` | 위쪽에 `data-stage` 값들을 작은 구간으로 표시, 현재 강조 |
| 학습지 (I5) | `section.handout` | 화면에는 안 보임. 단축키 안내 창의 [학습지 인쇄] → A4 세로, 빈칸은 밑줄로 인쇄 |
| 고대비 (J1) | `hc` | H 키 → 검정 글자·흰 배경, 장식·배경 움직임 끔 |
| 수식 (H3) | `math` | 고정 버전 KaTeX를 그때만 불러와 `\( \)`, `\[ \]` 렌더 |

### 9-7. 아이콘 세트

- 오픈소스 아이콘(예: Lucide—ISC, Tabler—MIT 중 하나)에서 40개 안팎을 골라 엔진 JS에 SVG로 넣는다. 라이선스 고지를 `engine/README.md`에 둔다.
- 이름 예: `book` `pencil` `bulb` `question` `check` `x` `clock` `users` `user` `chat` `globe` `map` `calendar` `star` `heart` `flag` `target` `chart` `search` `camera` `music` `film` `home` `leaf` `sun` `cloud` `water` `fire` `school` `trophy` `puzzle` `key` `link` `list` `arrow-right` `quote` `info` `alert` `gift` `scale`
- 이름 목록은 layouts.md 끝에 함께 넣는다 (AI가 없는 이름을 쓰지 않게).

### 9-8. 인쇄

- `@page`: 16:9는 13.333in × 7.5in, 4:3은 10in × 7.5in, 여백 0. 한 장에 한 슬라이드.
- 인쇄할 때: 클릭 단계 모두 보임, 움직임 끔, 조작 버튼·진행 막대 숨김, 빈 사진 칸은 연한 점선만.
- 학습지 인쇄는 A4 세로 별도 스타일.

### 9-9. 접근성

- section에 `aria-roledescription="slide"`, `aria-label="3 / 12"`. 장이 바뀌면 화면 낭독기용 알림 영역 갱신.
- 모든 버튼에 이름, 포커스 표시, 키보드 조작.
- 퀴즈 정답·오답은 색 + 기호 + 글자로 구분 (J2).

### 9-10. 확인할 브라우저

- Chrome, Edge, 네이버 웨일, Safari 최신 두 버전. 전자칠판의 안드로이드 Chrome. 1080p와 4K 화면.

### 9-11. 오프라인 파일로 바꾸기 (웹앱 기능)

- 사용자가 AI가 만든 HTML 파일을 끌어다 놓으면, 엔진 `<link>`·`<script>`를 웹앱이 가진 같은 버전 엔진 코드로 바꿔 `<style>`·`<script>`로 넣고 내려받게 한다.
- 웹 글꼴은 그대로 두되, 없을 때를 대비한 시스템 글꼴 대체 목록이 엔진에 있다.

### 9-12. 엔진 테스트

- 레퍼런스 덱(§11)으로: 레이아웃 × 테마 5종 화면 확인, 모든 위젯 동작, 모든 단축키, 인쇄 미리보기, 동작 줄이기, 4:3, 화면 크기 3종.
- 콘솔 오류 0개.

---

## 10. 내장 테마와 글꼴

### 10-1. 내장 테마 토큰 (초안)

| 테마 | bg | surface | ink | ink-2 | accent | accent-ink | accent-2 | 제목 글꼴 | radius | deco |
|---|---|---|---|---|---|---|---|---|---|---|
| 깔끔한 화이트 `white` | #FFFFFF | #F3F4F1 | #16181B | #5B6168 | #FF5A36 | #C2361A | #1E2A44 | pretendard | 16 | dots |
| 따뜻한 종이 `paper` | #FBF7F0 | #F1E9DC | #2B2420 | #6B6058 | #D9643A | #A8461F | #2F5D50 | serif | 8 | paper |
| 차분한 블루그레이 `bluegray` | #F6F8FA | #E8EEF4 | #1A2430 | #566476 | #2F6FE0 | #2457B5 | #F2A93B | pretendard | 12 | lines |
| 싱그러운 그린 `green` | #FFFFFF | #EEF5EA | #142016 | #4E5C50 | #3FAE5A | #23793A | #0F3D2E | rounded | 24 | blob |
| 파스텔 포인트 `pastel` | #FFFDF8 | #FFF1E6 | #222222 | #5E5A55 | #FF8A65 | #B54726 | #6C8EF5 | cute | 28 | blob |

- 값은 초안이다. 구현할 때 대비 계산 스크립트로 `ink`·`ink-2`·`accent-ink`가 `bg`·`surface` 위에서 4.5:1 이상인지 검증하고 맞지 않으면 조정한 뒤 기록한다.

### 10-3. 테마 팩 (v1.1.0, `engine/themes/{값}.css`)

| 테마 | 값 | 제목 글꼴 | 제목 등장 | 전환 | 배경 입자 | 바탕 |
|---|---|---|---|---|---|---|
| 스튜디오 | `studio` | Pretendard 800 | mask | wipe | 없음 | 밝음 |
| 매거진 | `magazine` | Hahmlet | blur | fade | 없음 | 밝음 |
| 칠판 | `chalk` | Gaegu | write | wipe | dust | 어두움 |
| 팝 | `pop` | Bagel Fat One | pop | curtain | 없음 (정답 축하 켬) | 밝음 |
| 노트 | `note` | Gaegu | write | cover | 없음 | 밝음 |
| 밤하늘 | `cosmos` | Pretendard 800 | chars | zoom | stars | 어두움 |
| 레트로 | `retro` | Do Hyeon | mask | curtain | 없음 | 밝음 |
| 보태니컬 | `botanic` | Gowun Batang | blur | fade | petals | 밝음 |

- 테마의 색은 `:root` 변수 8개(기존 7개 + `--on-accent`)로만 정한다. 생성 파일의 `<style>`이 이 변수를 덮어쓰면 테마의 구성은 그대로 두고 색만 바뀐다. 팝·노트·레트로의 보조 색(노랑·민트 등)과 칠판의 나무 테두리는 테마 안에 고정돼 있다.
- 분위기·어울리는 수업 문구는 index.html의 `PACKS`가 원본이다 (design-rules.md §2 표로 나간다).
- 대비: 본문·보조·강조 글자는 배경과 면 위에서 4.5:1 이상으로 계산해 정했다 (계산값은 TEST_LOG).
- 특정 캔바·미리캔버스 템플릿을 베끼지 않았다. 흔한 스타일 갈래(미니멀·잡지·칠판·팝·공책·밤하늘·복고·식물)를 참고해 새로 그렸다.

### 10-2. 제목 글꼴 `data-head-font`

| 값 | 글꼴 | 느낌 (B7) |
|---|---|---|
| `pretendard` | Pretendard Variable (800) | 단정한 고딕 (기본) |
| `rounded` | Gowun Dodum | 부드러운 둥근체 |
| `cute` | Jua | 귀엽고 둥근 제목 (저학년·파스텔) |
| `serif` | Noto Serif KR (700~900) | 진지한 명조 |
| `heavy` | Black Han Sans | 힘 있는 굵은 제목 |

- 본문은 항상 Pretendard Variable. 대체 글꼴: "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif.
- Pretendard는 jsDelivr 고정 버전, 나머지는 Google Fonts에서 엔진이 필요할 때만 불러온다. 실제 주소와 버전은 구현할 때 확인해 고정한다.
- `data-lang-extra="ja"`이면 일본어 글꼴(Noto Sans JP 또는 Pretendard JP)을, `zh`이면 중국어 글꼴을 추가로 불러온다.

---

## 11. 레퍼런스 덱 `samples/reference-deck.html`

- 엔진으로 만든 기준 덱. 모든 레이아웃·위젯·모션을 담는다. 개발용 테마 전환 버튼(5종)을 둔다.
- 쓰임: ① 엔진 시각 검수 ② 웹앱 미리보기 모달의 데모 원본 (모달은 iframe `srcdoc`으로 필요한 장만 렌더하고 `data-` 속성만 바꿔 재생) ③ "결과가 이렇게 나와요" 예시 화면.
- 수업자료는 사용자에게 받은 테스트 자료를 쓴다 (없으면 중립 주제로 임시 작성하고 표시).
