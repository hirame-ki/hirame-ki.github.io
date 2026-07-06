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

### 확인 필요 (운영 작업, 코드 아님)
- [ ] Supabase SQL Editor에서 `seat_charts` 테이블 생성 SQL 실행 필요 (자리배치표 저장/불러오기 기능 — 실행 전까지는 저장 시 오류 발생)
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

-- 자리배치표 저장 (별실 시험 - 불러오기/재저장용)
CREATE TABLE IF NOT EXISTS seat_charts (
  id SERIAL PRIMARY KEY,
  school_code TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'separate',
  exam_date DATE,
  period INT,
  grade INT,
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

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE absences;
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
3. 버튼은 **"저장하기"(파랑) → 클릭 시 "반영 완료"(초록)**로 바뀌고, 이후 추가로 수정하면 다시 "저장하기"로 돌아감 (재확인 필요 표시)
4. "반영 완료" 클릭 시 "응시현황표를 출력하시겠습니까?" 팝업 → 확인하면 별도 팝업창에 **재적/응시/결시(학생번호+사유)/결번**을 담은 세로형 표가 뜨고 자동으로 인쇄 대화상자가 열림 (A4 1장, 가득 채움)
5. 입력이 끝나면 반드시 로그아웃 (동시 접속 인원 제한 때문)

### 고사본부 확인
1. **고사본부 탭** → 날짜 선택, 필요 시 학년 / 반 필터
2. 상단 요약에 **총 재적 인원**과, 데이터가 있는 **모든 교시별 줄**로 응시(초록)/결시(빨강)/사유별(인정·미인정·질병·기타, 색상 구분) 인원이 한눈에 표시됨
3. 교시별 탭으로 학년 / 학급별 결시자 명단(사유 포함, 색상 통일) 실시간 확인
4. **📥 엑셀 다운로드** (날짜/학년/반 필터 옆) → 선택한 날짜 전체 데이터를 색상·표가 적용된 한셀 호환 xlsx로 다운로드 (① 전체 재적·결시 현황 ② 학년별 재적·결시 현황 ③ 결시 학생 명단, 3개 섹션)

### 자리배치표
**1단계 — 시험 방식 선택**: 별실 시험 / 각자교실 시험

**별실 시험** (여러 학급 학생이 한 방에 모여 응시, 예: 선택과목)
1. 2단계: 날짜 / 교시 / **학년** / 교실 행·열 수 / 앞번호 시작 방향(창가·복도) / **좌석 편집**(없는 자리 클릭해서 제외 — 기둥, 사물함 등 불규칙한 교실 구조 대응)
2. 3단계: 과목명 / 별실 호실 입력 → 선택한 **학년 전체 학생**이 반별로 그룹핑되어 나열됨(1반 전체, 2반 전체 순) → 응시자를 클릭해서 선택
3. 배치표 생성 → 선택된 학생이 **반-번호 순**으로 자동 배치, 좌석 칸에 **학년-반-번호-이름**까지 표시
4. 인쇄 버튼 옆 **현재 자리배치 저장** 버튼 → 날짜/교시/학년/과목명/호실/좌석 설정/선택 학생을 `seat_charts` 테이블에 저장. "3단계" 카드 우측 상단 **저장된 배치표 불러오기**로 목록을 열어 클릭하면 해당 설정이 그대로 복원되고 배치표가 즉시 재생성됨. 불러온 뒤 내용을 수정하고 다시 저장하면 새 항목이 아니라 **같은 저장 항목이 갱신**됨(버튼 라벨이 "다시 저장"으로 바뀜). 학년을 바꾸거나 다른 시험 방식으로 전환하면 새 저장으로 취급됨

**각자교실 시험** (자기 반 교실에서 그대로 응시)
1. 2단계: 날짜 / 교시 / **학급** / 교실 행·열 수 / 앞번호 시작 방향 / 좌석 편집
2. 3단계: 과목명 입력 → 선택한 **학급 학생 명단**이 나열됨 → 응시자를 클릭해서 선택
3. 배치표 생성 → **응시자(체크한 학생, 결시자 포함)가 앞쪽에 번호순으로 몰려 배치**되고, 미응시(선택 안 한 학생)는 그 뒤로 번호순 배치됨. 응시자 그룹 안에 있는 결시자는 자리를 당기지 않고 **자기 자리를 빨간 점선 + "결시"로 빈자리 처리**함 (시험 규정 반영). 좌석 칸에는 번호만 표시

**공통**
- 좌석 수(행×열, 편집으로 제외한 자리 제외)보다 배치할 인원(별실=선택 인원, 각자교실=학급 전체 인원)이 많으면 오류 안내
- 인쇄는 **가로 방향**으로 용지 폭을 가득 채우며, 자리배치표(과목명/교실명 상단 + 좌석배치 + 요약)만 인쇄됨 — 설정 화면·메뉴는 인쇄 안 됨

### 계정 / 보안
- 우측 하단 고정 칩("제작 : 황성재 @hirame.ki")은 인쇄 시 자동으로 숨김
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
| seat_charts | school_code | 자리배치표 저장(별실 시험 전용, mode='separate') — 좌석 설정 + 선택 학생 id 목록(JSONB) 저장, 불러오기 시 재적용 |

- Realtime 채널: 로그인 시 1회 생성(`abs-{SCHOOL_CODE}`), 로그아웃 또는 5분 유휴 시 해제. 같은 채널에 Presence를 붙여 헤더의 접속자 수 표시에 사용
- 엑셀 처리: 템플릿 생성(스타일링)은 ExcelJS, 업로드 파일 읽기는 SheetJS 사용 (용도별로 라이브러리 분리)

---

## 5. 구현되지 않은 목록 (TODO)

- [ ] **교시별 과목명 고정 설정** — 현재는 자리배치표 생성 시마다 과목명을 매번 직접 입력해야 함
- [ ] **자리배치표 PDF 내보내기** — 별도 "PDF로 저장" 버튼 없음 (인쇄 대화상자에서 "PDF로 저장" 선택은 가능하나 전용 기능은 아님)
- [ ] **결시 사유 통계/추이 등 장기 리포트** — 현재는 날짜 단위 엑셀 다운로드만 있고, 여러 날짜를 합산하는 리포트는 없음
- [ ] **학생 개별 삭제 UI** — 학급 단위 삭제(X 버튼)만 있고, 학급 내 학생 한 명만 삭제하는 기능은 없음 (전체 재저장으로 대체 가능)
- [ ] **RLS(행 단위 보안) 미적용** — 의도적으로 비활성화된 상태 (위 1번 섹션 참고), 민감도가 높아지면 정책 추가 필요
- [ ] **전체 학교 합산 동시 접속자 수는 표시 불가** — Supabase 클라이언트 SDK로는 프로젝트 전체의 실시간 연결 수를 조회할 수 없음(Supabase 대시보드에서만 확인 가능). 현재는 **우리 학교 접속자 수**만 헤더에 표시됨. 200명 한도에 근접했을 때 앱이 자동으로 경고하는 기능은 없음

---

## 6. 향후 개선 아이디어 (선택 사항)

- [ ] 반 단위가 아닌 학생 단위 결시 사유 통계 export
- [ ] 좌석 편집 결과(제외한 자리)를 학급/교실별로 저장해 재사용
- [ ] 응시현황표에 담임 서명란 등 학교 양식에 맞춘 커스터마이징
