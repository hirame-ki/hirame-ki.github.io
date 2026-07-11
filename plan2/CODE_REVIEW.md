# 코드 검토 및 수정 보고서

- **검토일**: 2026-07-12
- **대상 파일**: `index.html`, `audio.js`
- **결과**: 버그 6건 수정, 개선 2건 반영, 문법 검사(Node `--check`) 통과

---

## 1. 수정한 버그

### 1-1. 학생 엑셀 일괄등록 "등록하기" 버튼 무동작 (치명적) — `index.html`

- **증상**: 교사 설정의 엑셀 일괄등록에서 파일 업로드 후 "등록하기" 버튼을 눌러도 아무 동작이 없음.
- **원인**: `onclick="confirmBulkUpload(${JSON.stringify(students)...})"` 형태로 JSON을 HTML 속성에 직접 삽입. JSON에 포함된 큰따옴표(`"`)가 HTML 속성값을 중간에 끊어 onclick이 문법 오류가 됨.
- **수정**: 학생 목록을 `window._pendingBulkStudents` 변수에 담고 `onclick="confirmBulkUpload(window._pendingBulkStudents)"`로 참조하도록 변경. 등록/취소 시 변수 정리.

### 1-2. 편제표 리뷰에서 묶음(택N) 과목명 오염 — `index.html`

- **증상**: 편제표 인식 결과 검토 화면에서 묶음으로 지정된 과목명을 클릭했다가 다른 곳을 클릭하면 과목명이 `과목명묶음`으로 저장됨.
- **원인**: '묶음' 배지 `<span>`이 `contenteditable` 스팬 **내부**에 있어, blur 시 `this.textContent`(과목명 + "묶음")가 그대로 저장됨. 편집하지 않고 포커스만 줘도 발생.
- **수정**: 배지를 contenteditable 스팬 밖(형제 요소)으로 이동.

### 1-3. 학생 간 데이터 누출 + 선택과목 로컬 캐시 미복원 — `index.html`

- **증상 A**: 2학년 학생 A 로그아웃 후 학생 B 로그인 시, A가 저장한 이수완료 학기(`savedSems`)가 B에게 그대로 표시됨.
- **증상 B**: 과목 선택 후 자동저장(30초 주기) 전에 새로고침하면 작업 내용이 유실됨. `hsc_sel_학번` 로컬 캐시는 저장만 되고 **읽는 코드가 없었음**.
- **수정**:
  - `enterStudent()`에서 `S.selSubs`, `S.savedSems`를 항상 초기화 후 서버 데이터 적용.
  - 서버 응답에 selSubs가 없으면 `hsc_sel_학번` 캐시에서 복원.
  - `logout()`에서 `S.savedSems=[]` 리셋 추가.

### 1-4. 고시외 과목 삭제 버튼의 따옴표 이스케이프 무효 — `index.html`

- **증상**: 과목명에 작은따옴표(`'`)가 포함되면 삭제(✕) 버튼이 동작하지 않음.
- **원인**: `.replace(/'/g,"\'")` — JS에서 `"\'"`는 `"'"`와 동일하므로 실제로는 아무것도 이스케이프하지 않음.
- **수정**: 백슬래시 → 작은따옴표 → 큰따옴표 순으로 올바르게 이스케이프 (`\\` → `\\'` → `&quot;`).

### 1-5. 손상된 localStorage로 앱 부팅 실패 — `index.html`

- **증상**: `hsc_subs` 저장값이 손상되면 `init()`의 `JSON.parse`가 예외를 던져 화면 전체가 렌더링되지 않음(흰 화면).
- **수정**:
  - `init()` / `enterSetup()`의 `JSON.parse('hsc_subs')`에 try/catch 추가, 실패 시 기본 편제표(`DEFAULT_SUBS`)로 폴백.
  - URL의 `gas` 파라미터 `decodeURIComponent`에 try/catch 추가 (잘못된 `%` 시퀀스로 인한 URIError 방지).
  - 로그인 요청 URL의 `id`에 `encodeURIComponent` 적용.

### 1-6. 배경음악 빠른 토글 시 음악이 소리 없이 죽는 레이스 — `audio.js`

- **증상**: 배경음악을 껐다가 0.8초 안에 다시 켜면 새 음악이 시작 직후 조용히 멈춤.
- **원인**: `stopMusic()`의 800ms 지연 정리 `setTimeout`이 취소되지 않은 채 남아, 새로 시작된 오실레이터까지 `stop()` 처리하고 `_musicNodes`를 비움. 페이드아웃 중이던 `musicGain` 램프도 남아 있었음.
- **수정**:
  - 정리 타이머를 `Lux._stopTimer`로 추적, `startMusic()`에서 취소 후 이전 노드를 즉시 정리.
  - `startMusic()`에서 `musicGain`의 예약된 램프를 `cancelScheduledValues`로 취소하고 게인을 0.18로 복원.
  - `Lux` 객체에 `_stopTimer`, `_musicTimer`, `_bellTimer` 필드 명시.

---

## 2. 반영한 개선

### 2-1. 학기별 최대 과목 수(semMax) 서버 동기화 — `index.html`

- **문제**: 교사가 설정한 학기별 최대 선택 과목 수가 교사 기기 localStorage에만 저장되어, 학생에게는 항상 기본값 10이 적용됨.
- **개선**: 기존 `__HSC_CFG__` 마커(GAS 수정 불필요)의 JSON에 `semMax` 포함.
  - `saveScheduleToGAS()`: cfgJson에 `semMax: S.semMax` 추가.
  - `loadScheduleFromGAS()`: `cs.semMax` 수신 시 `S.semMax`에 병합 + localStorage 저장.
  - `saveSemMax()`: 변경 시 1.2초 디바운스로 `saveScheduleToGAS()` 호출.

### 2-2. 자동저장 안정화 — `index.html`

- `autoSaveSelection()`의 fetch에 `keepalive: true` 추가 — `beforeunload`에서 호출돼도 페이지 이탈로 요청이 취소되지 않음.
- 자동저장 페이로드에 `savedSems` 포함 — 다른 기기에서 로그인해도 2학년 이수완료 상태 유지 가능.
- `saveSemCompletion()` / `unsaveSem()`에서 `scheduleAutoSave()` 호출 추가.

---

## 3. 검토했으나 변경하지 않은 사항

| 항목 | 내용 | 판단 |
|------|------|------|
| 묶음 `pick` 값의 서버 왕복 | GAS가 name/cr/type/group 컬럼만 저장한다면 `pick`이 서버 재로드 시 유실될 수 있음. GAS 코드가 이 저장소에 없어 확인 불가 | **GAS 쪽에서 pick 컬럼 저장 여부 확인 권장** |
| innerHTML 직접 삽입 (XSS성) | 과목명·학생명을 innerHTML에 직접 삽입하는 곳이 다수. 입력 주체가 교사·학생 본인이라 실질적 위험 낮음 | 변경하지 않음 |
| `updateCreditBar()` 내 미사용 변수 `cls`, 도달 불가 분기 | 동작에 영향 없는 죽은 코드 | 변경하지 않음 (외관상 문제 없음) |
| 마감일 `hsc_deadline` 로컬 저장값 미사용 | 저장만 하고 읽지 않으나, 마감일은 GAS `getSchedule` 응답으로 로드되므로 동작에는 문제 없음 | 변경하지 않음 |

---

## 4. 검증

- `index.html` 인라인 스크립트 추출 후 `node --check` 통과
- `audio.js` `node --check` 통과
