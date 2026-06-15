-- =====================================================================
-- 쌤버스 - 맵 이동 순서(room_settings) Supabase 설정
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
--
-- 이 테이블은 교사가 대시보드의 "🚪 맵 이동 순서"에서 설정한,
-- 수업(room)별 맵 진행 순서를 저장합니다.
-- 학생 맵 페이지(ssambus_missions.js)는 이 값을 읽어,
-- 한 맵의 필수 미션을 모두 마치고 출입구에 들어가면
-- 순서상 다음 맵(단, 그 맵에 미션이 등록되어 있는 경우)으로 자동 이동시킵니다.
-- =====================================================================

create table if not exists room_settings (
  room_id text primary key,
  map_order jsonb not null default '[]'::jsonb,  -- 예: ["classroom","library","gym"]
  teacher_id uuid,
  updated_at timestamptz default now()
);

-- RLS: 읽기는 누구나(학생용), 쓰기는 작성자(교사) 본인만
alter table room_settings enable row level security;

drop policy if exists "room_settings readable by anyone" on room_settings;
create policy "room_settings readable by anyone"
  on room_settings for select
  using (true);

drop policy if exists "room_settings insert by owner" on room_settings;
create policy "room_settings insert by owner"
  on room_settings for insert
  with check (teacher_id = auth.uid());

drop policy if exists "room_settings update by owner" on room_settings;
create policy "room_settings update by owner"
  on room_settings for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
