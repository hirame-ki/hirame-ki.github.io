# 정기고사 관리 시스템 개발 가이드

## 프로젝트 구조

```
exam-system/
├── index.html         # 단일 파일 (전체 앱) — 실제 배포/작업 대상
└── index기존.html      # 디자인 변경 전 시점의 구버전 백업 (사용 안 함, 삭제 검토 필요)
```

---

## ⚠️ 진행 상황

### 완료된 운영 설정
- [x] `index.html`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 실제 프로젝트 값 입력 완료
- [x] Supabase SQL Editor에서 테이블 생성 SQL 실행 완료 (classes / students / absences)
- [x] Supabase SQL Editor에서 `reason`, `reason_detail` 컬럼 추가 SQL 실행 완료
- [x] GitHub Pages 배포 완료 (https://hirame-ki.github.io/exam)
- [x] 학교코드 설정 완료 (SEONGPO2025)
- [x] 학급/학생 등록 완료 (엑셀 일괄 업로드, 1~3학년 각 2개 반)
- [x] 결시 입력 실사용 테스트 (사유 입력, 저장 상태 전환 등 확인)
- [x] Supabase SQL Editor에서 `exam_dates` 테이블 생성 SQL 실행 완료
- [x] Supabase SQL Editor에서 `seat_charts` 테이블 생성 SQL 실행 완료 (자리배치표 저장/불러오기 정상 작동 확인)
- [x] Supabase SQL Editor에서 `input_completions` 테이블 생성 SQL 실행 완료 (결시 입력 "저장하기" → 응시현황표 출력 전환 및 고사본부 실시간 반영 확인)

### 확인 필요 (운영 작업, 코드 아님)
- [ ] 동료 교사에게 URL + 학교코드 공유 완료 여부 확인
- [ ] 실제 고사 기간에 전체 교사 대상 실사용 테스트

---

## 1. Supabase 설정 (최초 1회)

### 프로젝트 생성
1. [supabase.com](https://supabase.com) → New Project
2. Project URL, Anon Key 복사해 두기
3. 프로젝트 생성 시 고급 옵션 — **Enable Data API**: 체크 / **Automatically expose new tables**: 체크 / **Enable automatic RLS**: 체크 해제 (정책 없이 켜면 앱이 즉시 막힘)

### SQL 실행
Supabase → SQL Editor → 아래 실행 (실행 시 "Run without RLS" 선택)

```sql
-- 학급
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  grade INT NOT NULL,
  class_num INT NOT NULL,
  UNIQUE(school_code, grade, class_num)
);

-- 학생
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  number INT NOT NULL,
  name TEXT NOT NULL
);

-- 결시
CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  exam_date DATE NOT NULL,
  period INT NOT NULL,
  class_id INT REFERENCES classes(id),
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT DEFAULT '미인정',
  reason_detail TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_code, exam_date, period, student_id)
);

-- 고사 날짜
CREATE TABLE IF NOT EXISTS exam_dates (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  exam_date DATE NOT NULL,
  UNIQUE(school_code, exam_date)
);

-- 자리배치표 저장 (별실/각자교실 공용 - 불러오기/재저장용)
CREATE TABLE IF NOT EXISTS seat_charts (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'separate',
  exam_date DATE,
  period INT,
  grade INT,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  subject_name TEXT,
  room_name TEXT,
  rows INT NOT NULL,
  cols INT NOT NULL,
  start_side TEXT NOT NULL,
  disabled_seats JSONB DEFAULT '[]',
  student_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 이미 seat_charts를 만든 경우 (mode='separate'만 지원하던 구버전) 아래를 추가로 실행
ALTER TABLE seat_charts ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(id) ON DELETE CASCADE;

-- 결시 입력 제출 완료 기록 (고사본부 미제출 학급 현황판용)
CREATE TABLE IF NOT EXISTS input_completions (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  exam_date DATE NOT NULL,
  period INT NOT NULL,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_code, exam_date, period, class_id)
);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE absences;
ALTER PUBLICATION supabase_realtime ADD TABLE input_completions;
```

> ⚠️ **보안 참고**: RLS(행 단위 보안)를 켜지 않아 anon key만 알면 누구나 데이터에 접근 가능합니다. 학교코드로만 데이터를 구분하는 구조라 실질적인 보안 경계는 없습니다. 학생 이름/결시 기록 수준이라 지금은 문제없지만, 더 민감한 데이터를 다루게 되면 RLS 정책 추가를 고려해야 합니다.

---

## 2. GitHub Pages 배포

### 저장소 생성
1. GitHub → New repository
2. Repository name: `exam-system` (또는 원하는 이름)
3. Public 설정
4. `index.html` 업로드 (GitHub 웹에서 파일 업로드, 수정 시 재업로드)

### GitHub Pages 활성화
1. 저장소 → Settings → Pages
2. Source: `main` 브랜치, `/ (root)` 선택
3. Save → 배포 URL 확인

```
배포 URL: https://hirame-ki.github.io/exam/
```

---

## 3. 사용 방법

### 최초 설정 (관리자 교사 1회)
1. `index.html` 상단 스크립트의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 실제 값 입력 후 배포
2. 배포 URL 접속 → 학교코드 입력 후 시작 (최초 입력 시 해당 코드로 학교 데이터 생성)
3. **설정 탭(고사 담당자용)** → 고사 날짜 추가
4. **설정 탭** → 학급/학생 등록 — 엑셀 일괄 업로드(양식 다운로드 → 드래그앤드롭 업로드) 또는 수동 추가 중 선택
   - "학생 등록" 카드의 텍스트 영역 + "전체 저장(덮어쓰기)"는 **학급 전체 명단을 교체**하는 방식(줄 하나만 빠뜨려도 그 학생은 삭제됨)이라 신중하게 사용
   - 그 아래 **"개별 학생 관리"** 목록에서는 학급 선택 시 등록된 학생이 한 명씩 나열되며, 번호/이름을 고쳐 **저장**하거나 **삭제** 버튼으로 그 학생 한 명만 반영 가능 (전학생 추가·중도 전출 등 부분 수정에 적합)

### 동료 교사 공유
```
공유 내용:
- URL: https://hirame-ki.github.io/exam/
- 학교코드: SEONGPO2025  ← 관리자가 정한 코드
```
> Supabase URL/Anon Key는 코드에 이미 내장되어 있어 동료 교사는 입력할 필요 없음.
> 학교코드만 같으면 동일한 학교 데이터를 공유하며, 브라우저(localStorage)에 저장되어 다음부터 자동 로그인됨.
> **이 시스템은 여러 학교가 하나의 Supabase 무료 프로젝트를 공유합니다.** 동시 접속(Realtime 연결) 한도가 200명이라, 사용 후 반드시 로그아웃하도록 안내되어 있고 5분간 조작이 없으면 자동 로그아웃됩니다 (대시보드 상단 배너 + 결시 입력 탭 안내 문구로 고지).

### 결시 입력 (담임 교사)
1. **결시 입력 탭** → 날짜 / 담당 학급 / 교시 선택 → 불러오기
2. 이름 클릭 → 결시로 전환 (자동 저장), 결시로 표시되면 **사유(인정/미인정/질병/기타)** 선택 → 기타 선택 시 사유 직접 입력 가능
3. 버튼은 **"저장하기"(파랑) → 클릭 시 "반영 완료"(초록)**로 바뀌고, 이후 추가로 수정하면 다시 "저장하기"로 돌아감 (재확인 필요 표시). "반영 완료" 상태는 `input_completions` 테이블에 학급/날짜/교시 단위로 저장되어 고사본부의 제출 현황판에 반영되고, 새로고침해도 유지됨
4. "반영 완료" 클릭 시 "응시현황표를 출력하시겠습니까?" 팝업 → 확인하면 별도 팝업창에 **재적/응시/결시(학생번호+사유)/결번**을 담은 세로형 표가 뜨고 자동으로 인쇄 대화상자가 열림 (A4 1장, 가득 채움)
5. 입력이 끝나면 반드시 로그아웃 (동시 접속 인원 제한 때문)

### 고사본부 확인
1. **고사본부 탭** → 날짜 선택, 필요 시 학년 / 반 필터
2. 상단 요약에 **총 재적 인원**과, 데이터가 있는 **모든 교시별 줄**로 응시(초록)/결시(빨강)/사유별(인정·미인정·질병·기타, 색상 구분) 인원이 한눈에 표시됨
3. 교시 탭 아래 **제출 현황판** → 선택한 교시에 대해 재적 학급 전체를 학년별로 묶어 "제출완료(초록, 제출 시각 표시)/미제출(주황)" 칩으로 표시(학년 제목 옆에 그 학년의 제출 학급 수도 표시). 담임이 결시 입력 후 "반영 완료"를 눌러야 제출완료로 표시되며, 이후 수정해서 다시 "저장하기" 상태가 되면 자동으로 미제출로 되돌아감
4. 교시별 탭으로 학년 / 학급별 결시자 명단(사유 포함, 색상 통일) 실시간 확인
5. **📥 엑셀 다운로드** (날짜/학년/반 필터 옆) → 선택한 날짜 전체 데이터를 색상·표가 적용된 한셀 호환 xlsx로 다운로드 (① 전체 재적·결시 현황 ② 학년별 재적·결시 현황 ③ 결시 학생 명단, 3개 섹션)
6. 화면 하단 **기간 합산 결시 통계** 카드 → 단일 날짜가 아니라 **시작일~종료일 범위**(+ 학년/반 필터)로 결시 데이터를 합산 조회. 사유별 총계, 학급별 결시 건수, **학생별 누적 결시 순위**(사유별 세분화, 많은 순 정렬)를 화면에서 확인 가능하고, 옆의 **엑셀 다운로드**로 같은 데이터를 한셀 호환 xlsx(① 기간 전체 사유별 집계 ② 학급별 집계 ③ 학생별 누적 결시 명단, 3개 섹션)로 받을 수 있음. 여러 날짜에 걸친 상습 결시 파악에 사용

> **제출 현황판의 한계**: 교시는 담임이 결시 입력 시 직접 입력하는 자유 숫자라, 그 날짜에 "몇 교시까지 시험이 있는지"를 시스템이 미리 알지 못합니다. 따라서 교시 탭은 **누군가 그 교시로 최초 입력(또는 반영 완료)한 순간부터** 생성되며, 그 전에는 "1교시가 아직 하나도 없다"는 것 자체를 표시할 수 없습니다. 고사 당일 일정을 미리 등록해두고 그 기준으로 처음부터 미제출을 표시하려면 별도의 "교시 일정" 기능이 필요합니다.

### 자리배치표
**1단계 — 시험 방식 선택**: 별실 시험 / 각자교실 시험

**별실 시험** (여러 학급 학생이 한 방에 모여 응시, 예: 선택과목)
1. 2단계: **날짜 / 학년 / 교시** 순으로 선택 / 교실 행·열 수 / 앞번호 시작 방향(창가·복도) / **좌석 편집**(없는 자리 클릭해서 제외 — 기둥, 사물함 등 불규칙한 교실 구조 대응). 좌석 편집 칸 위에 **"칠판" 표시 바**와 좌우에 **"← 창가" / "복도 →" 라벨**이 있어 실제 배치 결과와 같은 방향 감각으로 편집 가능
2. 3단계: 과목명 / 별실 호실 입력 → 선택한 **학년 전체 학생**이 반별로 그룹핑되어 나열됨(1반 전체, 2반 전체 순) → 응시자를 클릭해서 선택
3. 배치표 생성 → 선택된 학생이 **반-번호 순**으로 자동 배치, 좌석 칸에 **학년-반-번호-이름**까지 표시. 이때 선택한 날짜/교시 기준으로 `absences` 테이블을 조회해서, 선택한 응시자 중 이미 결시 처리된 학생은 **자리를 그대로 유지한 채**(다른 학생이 당겨 앉지 않음) 빨간 점선 + "결시"로 표시됨(각자교실과 동일한 방식) — 결시생도 반드시 자기 자리에 배치되고 빈자리로 스킵되지 않음
4. 인쇄 버튼 옆 **현재 자리배치 저장** 버튼 → 날짜/교시/학년/과목명/호실/좌석 설정/선택 학생을 `seat_charts` 테이블에 저장. "3단계" 카드 우측 상단 **저장된 배치표 불러오기**로 목록을 열어 클릭하면 해당 설정이 그대로 복원되고 배치표가 즉시 재생성됨. 불러온 뒤 내용을 수정하고 다시 저장하면 새 항목이 아니라 **같은 저장 항목이 갱신**됨(버튼 라벨이 "다시 저장"으로 바뀜). 학년을 바꾸거나 다른 시험 방식으로 전환하면 새 저장으로 취급됨. 목록의 각 항목 옆 **삭제** 버튼으로 더 이상 필요 없는 저장 항목을 제거 가능(확인창 후 즉시 삭제, 되돌리기 불가). 현재 불러와 편집 중인 항목을 삭제하면 "저장" 버튼은 갱신이 아닌 새 저장으로 전환됨

**각자교실 시험** (자기 반 교실에서 그대로 응시)
1. 2단계: **날짜 / 학급 / 교시** 순으로 선택 / 교실 행·열 수 / 앞번호 시작 방향 / 좌석 편집(별실과 동일하게 칠판·창가·복도 표시 포함)
2. 3단계: 과목명 입력 → 선택한 **학급 학생 명단**이 나열됨 → 응시자를 클릭해서 선택
3. 배치표 생성 → **응시자(체크한 학생, 결시자 포함)가 앞쪽에 번호순으로 몰려 배치**되고, 미응시(선택 안 한 학생)는 그 뒤로 번호순 배치됨. 응시자 그룹 안에 있는 결시자는 자리를 당기지 않고 **자기 자리를 빨간 점선 + "결시"로 빈자리 처리**함 (시험 규정 반영). 좌석 칸에는 번호만 표시
4. 별실 시험과 동일하게 **현재 자리배치 저장 / 저장된 배치표 불러오기**(3단계 카드 우측 상단) 지원 — 날짜/교시/학급/좌석 설정/선택 학생을 저장(`seat_charts.mode='own'`, `class_id`로 학급 식별)하고, 목록에서 선택하면 그대로 복원 후 즉시 재생성됨

**공통**
- 좌석 배치 결과 범례에 **응시(남색)/미응시(회색)/결시(빨간 점선, 자리 유지)** 3가지 색이 표시됨(별실/각자교실 공통)
- 좌석 수(행×열, 편집으로 제외한 자리 제외)보다 배치할 인원(별실=선택 인원, 각자교실=학급 전체 인원)이 많으면 오류 안내
- 인쇄는 **가로 방향**으로 용지 폭을 가득 채우며, 자리배치표(과목명/교실명 상단 + 좌석배치 + 요약)만 인쇄됨 — 설정 화면·메뉴는 인쇄 안 됨
- 배치표 생성 후 **PDF로 저장** 버튼(인쇄 버튼 왼쪽) → html2canvas로 배치표 영역을 캡처해 jsPDF로 가로 A4 PDF 다운로드(한글 폰트 임베딩 없이도 화면 그대로 캡처하는 방식이라 한글이 깨지지 않음). 저장/불러오기 버튼 등 no-print 요소는 캡처에서 제외됨

### 계정 / 보안
- 우측 하단 고정 칩("제작:@hirame.ki 문의는 클릭")은 인쇄 시 자동으로 숨김
- 5분간 조작이 없으면 자동 로그아웃(실시간 연결도 함께 정리됨), 로그아웃 버튼도 실시간 연결을 정리하도록 수정됨
- 헤더 우측 "연결됨" 옆에 **우리 학교 실시간 접속자 수**(Supabase Realtime Presence 기반) 표시

### 디자인 / UI
- 전체 색상 테마를 남색·골드 톤으로 변경, 폰트는 Pretendard(본문) + Noto Serif KR(제목류) 적용 — 외부 디자인 도구로 `index.html`에 직접 반영됨(별도 파일 아님)
- 브라우저 탭 아이콘을 기본 지구본 아이콘 → 📝(메모) 이모지로 변경 (`<link rel="icon">`에 SVG 데이터 URI 사용, 별도 이미지 파일 불필요)

---

## 4. 데이터 구조 메모

| 테이블 | 분리 기준 | 비고 |
|---|---|---|
| classes | school_code | 학교별 학급 |
| students | class_id (→ school_code) | 학급에 종속 |
| absences | school_code | 결시 기록(사유 포함), Realtime 구독 |
| exam_dates | school_code | 고사 날짜 — DB 저장으로 전환, 담당자가 저장하면 다른 교사도 접속 시 동일하게 보임 |
| seat_charts | school_code | 자리배치표 저장(별실/각자교실 공용, mode='separate'\|'own') — separate는 grade, own은 class_id로 대상 식별. 좌석 설정 + 선택 학생 id 목록(JSONB) 저장, 불러오기 시 재적용 |
| input_completions | school_code | 결시 입력 "반영 완료" 기록(학급/날짜/교시 단위), 고사본부 제출 현황판의 근거 데이터. absences와 함께 Realtime 구독 |

- Realtime 채널: 로그인 시 1회 생성(`abs-{SCHOOL_CODE}`), 로그아웃 또는 5분 유휴 시 해제. 같은 채널에 Presence를 붙여 헤더의 접속자 수 표시에 사용, absences/input_completions 변경 시 고사본부 자동 새로고침
- 엑셀 처리: 템플릿 생성(스타일링)은 ExcelJS, 업로드 파일 읽기는 SheetJS 사용 (용도별로 라이브러리 분리)

---

## 5. 구현되지 않은 목록 (TODO)

- [ ] **RLS(행 단위 보안) 미적용** — 의도적으로 비활성화된 상태 (위 1번 섹션 참고), 민감도가 높아지면 정책 추가 필요. 진짜 격리를 하려면 Supabase Auth 등 개별 로그인 도입이 선행되어야 함(현재는 학교코드가 학교 전체가 공유하는 통행증이라 "누가 입력/저장했는지" 자체도 구분 안 됨 — 결시 입력 담당자 추적, 자리배치표 저장 목록도 같은 이유로 학교 내 전 교사에게 공유됨)
- [ ] **전체 학교 합산 동시 접속자 수는 표시 불가** — Supabase 클라이언트 SDK로는 프로젝트 전체의 실시간 연결 수를 조회할 수 없음(Supabase 대시보드에서만 확인 가능). 현재는 **우리 학교 접속자 수**만 헤더에 표시됨. 200명 한도에 근접했을 때 앱이 자동으로 경고하는 기능은 없음

### 검토 후 보류하기로 결정한 아이디어
- **교시별 과목명 고정 설정(시험 시간표 입력)** — 별실 시험은 담당자 1명이 1회성으로 입력·인쇄하는 흐름이라 자동완성의 이득이 거의 없고, 각자교실 시험(여러 담임이 같은 교시를 반복 입력 — 자동완성 이득이 있는 쪽)은 보통 한 교시에 과목이 갈리지 않아 다과목 매핑이 필요 없음. 반대로 다과목 매핑이 필요한 쪽(별실, 선택과목으로 한 교시에 2과목 이상)은 자동완성 이득이 없는 쪽이라, 두 필요가 서로 겹치지 않아 이 기능 전체의 실익이 낮다고 판단해 보류함. 각자교실 한정으로 "교시=과목 1:1" 단순 매핑 정도는 추후 요청 시 고려 가능

---

## 6. 향후 개선 아이디어 (선택 사항)

우선순위 높은 순:
- [ ] **개별 좌석표(책상 이름표) 인쇄** — 지금은 교실 전체가 한 장에 나오는 배치도만 있음. 책상에 붙이는 개인용 이름표(학년-반-번호-이름) 형식으로 별도 인쇄하는 옵션
- [ ] **배치표에서 학생 검색** — 좌석 수가 많을 때 이름으로 검색해서 좌석 위치를 하이라이트
- [ ] 좌석 편집 결과(제외한 자리)를 학급/교실별로 저장해 재사용
- [ ] 응시현황표에 담임 서명란 등 학교 양식에 맞춘 커스터마이징
