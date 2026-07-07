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

## 다음 세션에서 사용자가 직접 해야 할 것 (순서대로)

0. **테스트 데이터 정리**: SQL Editor에서
   `delete from institutions where org_key = 'ZZTEST_delete_me';` 실행 (cascade로 하위 기록 자동 삭제)
1. **Supabase**: `ssambus` 프로젝트 SQL Editor에서 `sign/supabase-schema.sql` 전체 실행
   ("Run without RLS" 선택) — **완료 (2026-07-07, 보안 패치 포함)**
2. `sign/index.html` 상단 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 실제 값 입력 — **완료 (2026-07-07)**
3. GitHub Pages에 `sign/` 내용 배포 (아직 이 폴더는 git 저장소가 아님 — 사용자가 나중에 직접
   저장소 연결)
4. [script.google.com](https://script.google.com)에서 **새 프로젝트**(시트 아님) 생성 →
   `sign/code.gs` 붙여넣기 → 웹 앱으로 배포(액세스: 모든 사용자) → URL 복사
5. 배포된 웹페이지 접속 → 3번 URL 붙여넣어 연결 → 관리자 비밀번호 최초 생성 →
   **기관 설정 → 구성원 관리 → 연수 관리** 순으로 입력 → 서명 1건 테스트 → 서명등록부 출력 테스트
6. 위 과정에서 실제로 막히는 부분이 나오면 그게 이번 구현의 첫 실전 검증이 됨 — 다음 세션에서
   그 결과를 갖고 디버깅 이어가면 됨

## 사용자가 명시적으로 보류 요청한 항목 (이번 구현 범위 제외)

- **주간 핑(Supabase 일시정지 방지) + 2개월 경과 서명기록 자동 아카이브를 도는 GitHub Actions
  워크플로**: "다른 작업이 다 끝나고 나서 직접 진행하겠다"고 하여 이번엔 구현 안 함.
  다만 이 자동화가 실제로 호출할 백엔드 조각은 이미 준비해둠:
  - Supabase: `archive_old_signatures(org_key, cutoff_date)` — service_role 키로만 실행 가능,
    잘라낼 기록을 반환하면서 동시에 삭제
  - `code.gs`: `doPost({action:'archiveBackup', rows:[...]})` — 받은 기록을 그 기관 드라이브에
    엑셀(구글시트)로 저장
  - 다음에 이어서 할 일: 위 두 조각을 매일/매주 호출하는 GitHub Actions 워크플로(.yml) 작성,
    그리고 별도로 3~4일 간격 핑 워크플로 작성 (+ 60일 무커밋 시 Actions 자동 비활성화를 막는
    사소한 자동 커밋 트릭도 같이 필요)
- 저장소 루트 구버전 v4를 어떻게 할지(유지/삭제/승격) — 미결, 다음에 상의 필요

## 논의됐지만 아직 구현 안 한 아이디어 (향후 후보)

- ⏰ 연수별 서명 마감시각 설정
- ✅ 개인정보 수집 동의 체크박스
- 🏆 개인별 참가확인증 출력 (서명등록부와 별개로 1인 1장 증명서)
- 단축 URL을 관리자가 수동으로 bitly 등에서 만들어 QR로 쓰는 대안 (da.gd/clck.ru도 장애 가능성 있음을 고지함)
