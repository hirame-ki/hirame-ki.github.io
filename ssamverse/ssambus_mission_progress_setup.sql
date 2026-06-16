-- =====================================================================
-- 쌤버스 - 학생 미션 진행도 기록(mission_progress) Supabase 설정
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
--
-- 학생이 미션을 완료할 때마다 ssambus_missions.js가 이 테이블에 기록합니다.
-- 교사 대시보드의 "📊 미션 진행현황 엑셀 다운로드" 기능이 이 테이블을 조회합니다.
--
-- [참고] 학생은 별도 로그인 없이(익명) 이용하므로, nickname에는 학생이
-- 입장 시 입력한 별명이 그대로 저장됩니다. 실명을 입력하지 않도록
-- 안내하는 것을 권장합니다.
-- =====================================================================

create table if not exists mission_progress (
  id bigint generated always as identity primary key,
  room_id text not null,
  student_id text not null,
  nickname text,
  map_id text not null,
  mission_id text not null,
  mission_title text,
  required boolean default true,
  completed_at timestamptz default now(),
  student_answer text,          -- 주관식(short_answer) 미션에서 학생이 입력한 답안
  unique (room_id, student_id, mission_id)
);

alter table mission_progress enable row level security;

-- 읽기: 누구나 (교사 대시보드가 room_id로 필터링해 조회)
drop policy if exists "mission_progress readable by anyone" on mission_progress;
create policy "mission_progress readable by anyone"
  on mission_progress for select
  using (true);

-- 작성/수정: 누구나 (학생은 익명 상태로 이용하므로 인증 없이 기록)
drop policy if exists "mission_progress insert by anyone" on mission_progress;
create policy "mission_progress insert by anyone"
  on mission_progress for insert
  with check (true);

drop policy if exists "mission_progress update by anyone" on mission_progress;
create policy "mission_progress update by anyone"
  on mission_progress for update
  using (true)
  with check (true);

-- 주관식 답안 컬럼 추가 (기존 테이블에 적용)
alter table mission_progress
  add column if not exists student_answer text;
