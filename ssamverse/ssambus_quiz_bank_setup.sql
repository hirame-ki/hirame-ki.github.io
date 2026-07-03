-- =====================================================================
-- 쌤버스 - 자료실/문제은행(quiz_bank) Supabase 설정
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
--
-- ssambus_teacher_dashboard_setup.sql(v2)에서 쓰는 것과 동일한 방식으로,
-- "이 행을 만든 교사(teacher_id = 익명 인증 ID)"만 수정/삭제할 수 있습니다.
-- Authentication > Sign In / Providers > Anonymous 가 이미 켜져 있어야 합니다.
-- (교사 대시보드가 이미 사용 중인 설정이므로 별도 추가 작업은 필요 없습니다.)
--
-- [동작 방식]
-- - 읽기(select): 본인이 만든 자료 + is_public = true 인 공개 자료 모두 조회 가능
-- - 쓰기(insert): teacher_id가 본인 익명 인증 ID인 경우만 추가 가능
-- - 수정/삭제(update/delete): 작성한 본인만 가능 (공개 여부 토글 포함)
-- =====================================================================

create table if not exists quiz_bank (
  id bigint generated always as identity primary key,
  teacher_id uuid not null,
  title text not null,
  type text not null check (type in ('youtube','quiz','google_form','link','image_quiz','short_answer','discussion','ox_quiz')),
  content text,               -- youtube/구글폼/링크 URL
  quiz jsonb,                 -- missions.quiz와 동일한 구조
  required boolean default true,
  is_public boolean not null default false,
  created_at timestamptz default now()
);

alter table quiz_bank enable row level security;

drop policy if exists "quiz_bank select own or public" on quiz_bank;
create policy "quiz_bank select own or public"
  on quiz_bank for select
  using (is_public = true or teacher_id = auth.uid());

drop policy if exists "quiz_bank insert by owner" on quiz_bank;
create policy "quiz_bank insert by owner"
  on quiz_bank for insert
  with check (teacher_id = auth.uid());

drop policy if exists "quiz_bank update by owner" on quiz_bank;
create policy "quiz_bank update by owner"
  on quiz_bank for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "quiz_bank delete by owner" on quiz_bank;
create policy "quiz_bank delete by owner"
  on quiz_bank for delete
  using (teacher_id = auth.uid());
