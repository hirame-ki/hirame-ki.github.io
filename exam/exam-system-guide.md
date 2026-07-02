# 정기고사 관리 시스템 개발 가이드

## 프로젝트 구조

```
exam-system/
└── index.html        # 단일 파일 (전체 앱)
```

---

## ⚠️ 진행 중 (TODO)

- [x] `index.html`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 실제 프로젝트 값 입력 완료
- [x] Supabase SQL Editor에서 테이블 생성 SQL 실행 완료
- [ ] GitHub Pages 배포

---

## 1. Supabase 설정 (최초 1회)

### 프로젝트 생성
1. [supabase.com](https://supabase.com) → New Project
2. Project URL, Anon Key 복사해 두기

### SQL 실행
Supabase → SQL Editor → 아래 실행

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
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_code, exam_date, period, student_id)
);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE absences;
```

---

## 2. GitHub Pages 배포

### 저장소 생성
1. GitHub → New repository
2. Repository name: `exam-system` (또는 원하는 이름)
3. Public 설정
4. `index.html` 업로드 (GitHub 웹에서 파일 업로드)

### GitHub Pages 활성화
1. 저장소 → Settings → Pages
2. Source: `main` 브랜치, `/ (root)` 선택
3. Save → 배포 URL 확인

```
배포 URL 예시: https://hirame-ki.github.io/exam-system/
```

---

## 3. 사용 방법

### 최초 설정 (관리자 교사 1회)
1. `index.html` 상단 스크립트의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 실제 값 입력 후 배포
2. 배포 URL 접속 → 학교코드 입력 후 시작 (최초 입력 시 해당 코드로 학교 데이터 생성)
3. **설정 탭** → 고사 날짜 추가
4. **설정 탭** → 학급 추가 → 학생 등록

### 동료 교사 공유
```
공유 내용:
- URL: https://hirame-ki.github.io/exam-system/
- 학교코드: SEONGPO2025  ← 관리자가 정한 코드
```
> Supabase URL/Anon Key는 코드에 이미 내장되어 있어 동료 교사는 입력할 필요 없음.
> 학교코드만 같으면 동일한 학교 데이터를 공유하며, 브라우저(localStorage)에 저장되어 다음부터 자동 로그인됨.
> 같은 학교의 다른 선생님과 추가로 공유하고 싶을 때도 URL + 학교코드만 전달하면 됨.

### 결시 입력 (담임 교사)
1. **결시 입력 탭** → 날짜 / 교시 / 학급 선택 → 불러오기
2. 결시 학생 클릭 → 자동 저장

### 고사본부 확인
1. **고사본부 탭** → 날짜 선택
2. 교시별 탭으로 학년 / 학급별 결시 현황 실시간 확인

### 자리배치표
1. **자리배치표 탭** → 날짜 / 교시 / 학급 선택
2. 모드 선택:
   - **별실**: 응시자 직접 선택 → 배치표 생성
   - **각자교실**: 미응시자 설정 (또는 전원 응시) → 배치표 생성
3. 인쇄 버튼

---

## 4. 데이터 구조 메모

| 테이블 | 분리 기준 | 비고 |
|---|---|---|
| classes | school_code | 학교별 학급 |
| students | class_id (→ school_code) | 학급에 종속 |
| absences | school_code | 결시 기록, Realtime 구독 |

- 고사 날짜는 `localStorage`에 학교코드별로 저장 (`examDates_SEONGPO2025`)
- Realtime 채널 필터: `school_code=eq.{SCHOOL_CODE}`

---

## 5. 향후 개선 아이디어

- [ ] 결시 사유 입력 필드 추가
- [ ] 날짜별 전체 결시 현황 Excel 다운로드
- [ ] 고사 날짜를 DB에 저장 (현재는 localStorage)
- [ ] 교시별 과목명 설정
- [ ] 자리배치표 PDF 내보내기
