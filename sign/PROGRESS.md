# 작업 진행 상황 (다음 세션 이어하기용)

마지막 업데이트: 2026-07-07

## 프로젝트 배경 · 아키텍처 변천

1. **v4** (저장소 루트의 `code.gs`/`index.html`, 건드리지 않음): 구글 시트 바인딩 Apps Script.
2. **v5** (`sign/` 폴더, 이전 세션): 시트 바인딩은 유지하되 JSON API 방식으로 전환 + 웹페이지에서
   연수 등록/수정/삭제가 가능한 관리자 패널 추가.
3. **v6** (이번 세션, 현재 상태): v5에서 "관리자 패널 하나 늘릴 때마다 시트 스키마 기반
   백엔드를 같이 고쳐야 하는" 문제와 "구성원 등록도 웹에서 하고 싶다"는 요구가 겹치면서,
   **하이브리드 구조로 전면 전환**:
   - 서명 **이미지**만 기관별로 각자 배포한 (이제는 시트 없는 스탠드얼론) Apps Script + 그 기관의
     구글 드라이브에 저장 → 용량이 기관마다 분산되는 v4/v5의 장점은 그대로 유지
   - **그 외 전부**(기관명·부서·구성원·연수명/설명/날짜·연수 등록·수정·삭제·서명기록 텍스트·
     관리자 PIN·안내문·대표색상)는 **기존에 운영 중이던 Supabase 프로젝트 `ssambus`**에
     테이블을 추가해 처리 (기관들이 `org_key`로 구분되는 멀티테넌트 공용 DB)
   - 결정 배경(용량 계산, 새 계정 생성 검토 후 기각한 이유, 1개월 vs 2개월 보관 논의 등)은
     이번 세션 대화 로그 참고. 결론: **기존 프로젝트 재사용으로 결정**, ssambus/exam 둘 다
     여유 용량이 넉넉해(둘 다 500MB~1GB 중 0.3GB만 사용 중) 별도 계정 불필요.

## 폴더 구조

```
전자서명/
├─ code.gs, index.html          ← 구버전(v4) 원본, 건드리지 않음 — 처리 방향 미정
└─ sign/                        ← v6 (현재 최신)
   ├─ code.gs                  Apps Script — 기관별 배포, 이미지 업로드 전용 (시트 불필요)
   ├─ index.html                GitHub Pages 공통 웹페이지 (Supabase 클라이언트 내장)
   ├─ supabase-schema.sql       Supabase에 실행할 테이블 + RPC 함수 전체
   └─ README.md                 설치 가이드
```

## 이번 세션에서 실제로 완료한 작업

1. `sign/supabase-schema.sql` 신규 작성 — institutions/staff/trainings/signatures 테이블 +
   RPC 함수 15개(공개 4개 + 관리자 7개 + 내부헬퍼 3개 + 아카이브 1개). 테이블 직접 접근은
   전부 REVOKE, admin_pin 컬럼도 컬럼 단위로 SELECT 차단 — anon key가 노출돼도 PIN·전체
   목록이 새어나가지 않도록 설계.
2. `sign/code.gs` 전면 재작성 — 시트 바인딩 제거, 스탠드얼론 Apps Script로 전환.
   `doGet(?action=ping)` / `doPost`(이미지 업로드 기본 액션 + `archiveBackup` 액션)만 남음.
3. `sign/index.html` 전면 수정 — Supabase JS 클라이언트 추가, `connectApi`/`loadPageData`/
   서명 제출/서명등록부 조회/관리자 패널 전체를 Supabase RPC 호출로 전환. 관리자 패널에
   **구성원 관리 탭**(신규)과 **기관 설정 탭**(신규, 색상은 `<input type="color">`)을 추가해
   기관명·부서·구성원·연수·안내문·색상을 전부 웹에서 관리하도록 확장. 데모 모드도 함께 확장.
4. `sign/README.md` v6 구조로 갱신.

## 초기 마이그레이션 이후 UI 개선 (같은 세션, 이어서 진행)

Supabase 연결·검증 완료 후 사용자 피드백을 받아 다음을 추가/수정함:

- **모달 z-index 버그 수정**: 관리자 패널(z-index 1200)이 팝업 모달(999)보다 위에 있어
  연수·구성원 추가/수정 팝업이 패널 뒤에 숨어 안 보이던 문제 → 모달 z-index를 1500으로 올려 해결.
- **구성원 관리**: 부서를 드롭다운으로 선택(＋새 부서 직접 입력) + 여러 명을 줄바꿈/쉼표로 구분해
  **한 번에 일괄 등록**(엑셀 복붙 지원, `bulk_add_staff` RPC) + 목록을 **부서별로 그룹 나열**
  (먼저 등록한 부서가 위) + 부서 제목줄의 **[부서명 수정]**으로 전원 일괄 변경(`rename_dept` RPC).
  기관 설정의 "부서 목록" 입력칸은 혼란을 줄이기 위해 제거 — 부서는 구성원 관리 한 곳에서만 관리.
- **연수 관리**: "연수 내용" 자유 입력을 **대상(드롭다운: 전 구성원/희망자/자율 참여/필수 참여/직접입력)
  + 시간(네이티브 시간 선택기, 시작~종료)**으로 분리. 저장 시 기존과 동일한 문자열로 합쳐지므로
  DB 스키마 변경 없음, 기존 데이터도 자동 파싱해서 수정 폼에 채워짐.
- **기관 설정 안내문 필드**에 용도 설명 힌트 추가(서명 화면 상단 배너로 표시됨).
- **공유 링크 모달**: QR 이미지 클릭/[확대보기]로 전체화면 확대, [이미지 저장]으로 다운로드 추가.
- **브랜딩**: 탭 파비콘을 ✍️ 이모지로, 하단 "Designed & Built by..." 문구를 제거하고 **우측 하단
  고정 칩**(`@hirame.ki 문의:클릭`, 인스타 링크, 인쇄 시 자동 숨김)으로 대체 — 모든 화면에 항상 노출.
- **`code.gs`에 사용설명서 시트 생성 기능 추가**: 스탠드얼론 배포 방식은 그대로 유지하되,
  "코드가 담긴 시트 사본"으로 배포하고 싶은 경우를 위해 `onOpen()`(시트 바인딩 시에만 동작) +
  `setupGuideSheet()` 함수를 추가. 실행하면 `📖 사용설명서` 탭에 ①Apps Script 배포(새 배포→
  웹앱→나/모든사용자→URL 복사→hirame-ki.github.io/sign 접속) ②웹페이지 초기설정(관리자 PIN→
  기관설정→구성원→연수→공유링크) 순서가 전부 정리되어 생성됨. `WEBAPP_URL` 상수(`https://hirame-ki.github.io/sign`)는
  실제 GitHub Pages 주소가 맞다고 **사용자 확인 완료** (2026-07-08).
- 사용설명서 시트에 스크린샷 등 이미지를 넣고 싶을 때는 "삽입 → 이미지 → 셀에 이미지 삽입"으로
  직접 넣어야 시트 사본을 만들 때 이미지도 함께 복사됨을 안내함 (`=IMAGE("외부URL")` 수식 참조 방식은
  원본 파일 공유 권한에 따라 사본에서 깨질 수 있어 비권장).

`bulk_add_staff` / `rename_dept` SQL 패치는 **원격 호출로 라이브 DB 반영 확인 완료** (2026-07-08).

## 검증 상태

- `code.gs`·`index.html` 인라인 스크립트 문법 검증 통과, HTML id/onclick 참조 정합성 확인.
- **Supabase 백엔드는 원격(curl/Node)으로 엔드투엔드 검증 완료** (2026-07-07): 기관 등록 →
  PIN 최초 생성/재생성 거부 → 기관 설정 → 구성원/연수 등록 → 공개 페이지 조회 → 서명 제출 →
  중복 차단(UNIQUE) → 등록부 PIN 잠금/조회 → 잘못된 PIN 거부, 테이블 직접 접근 차단까지 전부 통과.
  ⚠️ 이때 테스트 기관 `ZZTEST_delete_me`가 DB에 남아 있음 — 아래 정리 SQL 실행 필요.
- **보안 패치 이력**: Supabase는 default privileges로 새 함수에 anon 직접 실행권한을 자동
  부여하므로 `REVOKE ... FROM public`만으로는 부족했음 → `from public, anon, authenticated`로
  회수하는 패치를 라이브 DB에 실행 완료, `supabase-schema.sql` 원본에도 반영됨.
  (이 교훈: Supabase에서 함수 잠글 때는 반드시 anon/authenticated에게서 직접 REVOKE)
- **브라우저 렌더링/클릭 테스트는 여전히 못 함** (Chrome 확장 미연결). 데모 모드 포함 UI 흐름,
  그리고 Apps Script 이미지 업로드(구글 쪽)는 실제로 안 돌려봄.

## GitHub Actions 자동화 (핑 · 아카이브 · 알림) — 구현 완료 (2026-07-08)

앞서 "나중에 직접 하겠다"고 보류했던 항목을, 사용자가 알림 요구사항(백업 완료 시 알림 +
백업 위치 안내)을 추가로 요청하면서 이번에 전부 구현함:

- **`.github/workflows/sign-ping.yml`**: 3일마다 Supabase에 요청 1건 → 무료플랜 일시정지 방지.
  동시에 sentinel 파일 커밋 → GitHub의 60일 무커밋 시 예약 워크플로 자동 비활성화도 방지.
  ⚠️ **ssambus 프로젝트는 이미 다른 워크플로가 주기적으로 깨우고 있음을 확인함** (2026-07-08,
  실행 기록 초록불 확인). Supabase의 "1주일 미사용 시 일시정지"는 프로젝트 전체 단위라 이
  기존 핑만으로 sign 시스템 테이블도 함께 보호됨 — 이 워크플로는 사용자 판단으로 **이중
  안전장치 목적으로만 유지**, 없어도 무방.
- **`.github/workflows/sign-archive.yml`** + **`.github/scripts/sign-run-archive.mjs`**: 매주 월요일,
  전체 기관을 순회하며 `archive_old_signatures()` 호출(기본 60일 경과 기록) → 기관의 Apps Script로
  전송해 드라이브에 백업 저장.
- **`code.gs`의 `_notifyArchiveBackup()`**: 백업 완료 시 `MailApp`으로 이메일 발송(건수 + 백업
  시트 바로가기 링크). 수신자는 기본적으로 `Session.getEffectiveUser().getEmail()`(스크립트를
  배포한 계정)이며, `NOTIFY_EMAIL` 상수로 다른 주소 지정 가능. 발송 실패해도 백업 자체는 실패
  처리하지 않음(별도 try/catch).
- 이 자동화는 **DB 스키마 변경이 필요 없음** — 기존 `archive_old_signatures`/`institutions.apps_script_url`을
  그대로 사용.

### ⚠️ 배포 토폴로지 정정 (2026-07-08) — 매우 중요

처음엔 `sign/`이 자체 GitHub 저장소가 될 거라 가정하고 워크플로 파일을 `sign/.github/...`에
만들었으나, **실제로는 `hirame-ki.github.io`라는 하나의 저장소 안에 `/sign`, `/ssamverse` 등
여러 프로젝트가 하위 폴더로 같이 존재**하는 구조임이 확인됨 (사용자가 지금까지 파일을 GitHub
웹 UI로 직접 업로드하는 방식으로 운영 중, git 연동 아님). 이에 따라:
- 워크플로/스크립트 파일은 `sign/` 안이 아니라 **저장소 루트**의 `.github/workflows/`,
  `.github/scripts/`에 올려야 함 (GitHub Actions는 저장소 루트만 인식)
- 시크릿 이름은 다른 프로젝트(ssamverse 등)와 겹치지 않도록 **`SIGN_` 접두사**로 변경:
  `SIGN_SUPABASE_URL`, `SIGN_SUPABASE_ANON_KEY`, `SIGN_SUPABASE_SERVICE_ROLE_KEY`
  (기존에 저장소에 이미 `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`GROQ_API_KEY`가 다른 프로젝트용으로
  등록되어 있는 것을 발견 — 이름 충돌·오용 방지 위해 구분함)
- 로컬 파일도 `sign/.github/workflows/sign-ping.yml`, `sign-archive.yml`,
  `sign/.github/scripts/sign-run-archive.mjs`로 이름 변경 완료 (업로드 시 저장소 루트의
  `.github/...`로 옮겨서 올려야 함 — `sign/` 접두사 없이)

### 실제 배포·디버깅 과정에서 겪은 문제들 (2026-07-08, 전부 해결됨)

1. YAML `name:` 필드에 `[sign]` 형태로 대괄호를 썼다가 YAML 문법 오류 발생
   (`[`는 flow sequence 시작 문자라 뒤에 텍스트가 오면 파싱 실패) →
   `"sign: 워크플로명"` 형태(따옴표로 감싼 문자열)로 수정.
2. Secrets를 `SIGN_` 접두사 없이 시도 → 이미 다른 프로젝트가 쓰는 `SUPABASE_URL`과 이름이
   겹쳐 "already exists" 에러 → `SIGN_SUPABASE_URL` 등으로 새로 등록.
3. `archive` 워크플로가 `SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다`로 실패
   → `SIGN_SUPABASE_SERVICE_ROLE_KEY`가 애초에 등록 안 되어 있었음 → 등록 후 해결.
4. `ping` 워크플로가 curl exit code 3(URL 형식 오류)로 실패 → `SIGN_SUPABASE_URL` 값이 비어있거나
   손상되어 있었던 것으로 추정 → Update로 값 재입력 후 해결.
5. **최종적으로 핑·아카이브 워크플로 둘 다 성공 확인 완료** (2026-07-08, 사용자 확인).
   GitHub Actions 자동화(핑/아카이브/알림) 구축이 완전히 끝난 상태.

## 완료된 것 (전부 확인됨)

- Supabase `ssambus` 프로젝트에 `supabase-schema.sql` + 이후 모든 패치(`bulk_add_staff`,
  `rename_dept`, `delete_signature`, `get_signature_records` id 포함) 실행 및 원격 검증 완료
- 테스트 데이터(`ZZTEST_delete_me`) 정리 완료
- `sign/index.html`에 실제 `SUPABASE_URL`/`SUPABASE_ANON_KEY` 입력 완료
- `hirame-ki.github.io` 저장소 루트에 `.github/workflows/sign-ping.yml`,
  `.github/workflows/sign-archive.yml`, `.github/scripts/sign-run-archive.mjs` 업로드 완료
- Secrets 3개(`SIGN_SUPABASE_URL`, `SIGN_SUPABASE_ANON_KEY`, `SIGN_SUPABASE_SERVICE_ROLE_KEY`) 등록 완료
- 핑·아카이브 워크플로 수동 실행(`Run workflow`) **둘 다 성공 확인** (2026-07-08)
- `sign/index.html`은 `hirame-ki.github.io/sign` 경로로 이미 GitHub Pages에 배포되어 실제로
  테스트 중 (사용자가 파일을 GitHub 웹 UI로 직접 업로드하는 방식으로 운영)

## 다음 세션에서 사용자가 직접 해야 할 것

1. [script.google.com](https://script.google.com)에서 **새 프로젝트**(시트 아님) 생성 →
   `sign/code.gs` 붙여넣기 → 웹 앱으로 배포(액세스: 모든 사용자) → URL 복사
   (또는 `sign/README.md`의 "사본(시트)으로 배포하고 싶다면" 방식으로 사용설명서 시트 포함 배포)
2. 배포된 웹페이지(`hirame-ki.github.io/sign`)에서 1번 URL로 연결 → 관리자 비밀번호 최초 생성 →
   **기관 설정 → 구성원 관리 → 연수 관리** 순으로 입력 → 서명 1건 테스트 → 서명등록부 출력 테스트 →
   **서명 기록 탭에서 삭제 테스트**
3. 위 과정에서 실제로 막히는 부분이 나오면 그게 이번 구현의 첫 실전 검증이 됨 — 다음 세션에서
   그 결과를 갖고 디버깅 이어가면 됨

## 남은 미결 항목

- 저장소 루트 구버전 v4를 어떻게 할지(유지/삭제/승격) — 미결, 다음에 상의 필요

## 논의됐지만 아직 구현 안 한 아이디어 (향후 후보)

- ⏰ 연수별 서명 마감시각 설정
- ✅ 개인정보 수집 동의 체크박스
- 🏆 개인별 참가확인증 출력 (서명등록부와 별개로 1인 1장 증명서)
- 단축 URL을 관리자가 수동으로 bitly 등에서 만들어 QR로 쓰는 대안 (da.gd/clck.ru도 장애 가능성 있음을 고지함)
