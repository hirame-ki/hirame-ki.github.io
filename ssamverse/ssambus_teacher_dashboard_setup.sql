-- =====================================================================
-- 쌤버스 - 교사 대시보드용 Supabase 설정 (v2: 작성자 본인만 수정/삭제)
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
-- 이전에 ssambus_teacher_dashboard_setup.sql(v1)을 실행한 적이 있어도
-- 이 파일을 다시 실행하면 정책이 새 버전으로 교체됩니다.
--
-- ⚠ 추가로 꼭 해야 할 설정 (SQL Editor가 아닌 대시보드 화면 작업):
--   Authentication > Sign In / Providers > Anonymous 항목을 ON으로 켜주세요.
--   (교사 대시보드가 "로그인 없이" 각 기기를 구분하기 위해 사용하는 익명 인증입니다.
--    이메일/비밀번호 회원가입이 아니며, 학생/교사는 이 과정을 전혀 보지 않습니다.)
--
-- [동작 방식]
-- - 읽기(select)는 여전히 누구나 가능합니다. (학생이 room_id로 자기 수업 미션을
--   불러올 수 있어야 하기 때문)
-- - 쓰기(insert/update/delete)는 "이 행을 만든 사람(teacher_id)"만 가능합니다.
--   teacher_id는 대시보드가 자동으로 부여하는 익명 인증 ID로, 같은 수업 코드를
--   알아도 다른 교사(다른 기기)는 수정/삭제 버튼이 동작하지 않습니다.
-- - 단, missions 테이블 자체를 필터 없이 통째로 조회하면(개발자도구/API 직접 호출)
--   다른 수업의 행도 보일 수 있습니다. 미션 "내용"이 학생 개인정보가 아니므로
--   학교 수업용으로는 충분한 수준이며, 완전한 비공개가 필요하면 Edge Function
--   기반 구조로 추가 전환이 필요합니다.
-- =====================================================================

-- 1) 작성자 식별용 컬럼 추가
alter table missions add column if not exists teacher_id uuid;

-- 2) RLS 정책 재설정
alter table missions enable row level security;

drop policy if exists "missions writable by anyone" on missions;
drop policy if exists "missions are readable by anyone" on missions;
drop policy if exists "missions insert by owner" on missions;
drop policy if exists "missions update by owner" on missions;
drop policy if exists "missions delete by owner" on missions;

-- 읽기: 누구나 (학생용)
create policy "missions are readable by anyone"
  on missions for select
  using (true);

-- 추가: 본인 명의(teacher_id = 내 익명 인증 ID)로만 추가 가능
create policy "missions insert by owner"
  on missions for insert
  with check (teacher_id = auth.uid());

-- 수정/삭제: 작성한 본인만 가능
create policy "missions update by owner"
  on missions for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "missions delete by owner"
  on missions for delete
  using (teacher_id = auth.uid());
