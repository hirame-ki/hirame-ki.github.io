-- =====================================================================
-- 쌤버스 - 미션 시스템 Supabase 설정
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 실행하세요.
-- =====================================================================

-- 1) missions 테이블 생성
create table if not exists missions (
  id text primary key,
  room_id text not null,
  map_id text not null,        -- classroom | library | playground | gym | city | forest
  zone_id text not null,       -- zone_A | zone_B | zone_C
  title text not null,
  type text not null check (type in ('youtube','quiz','google_form','link')),
  content text,                -- youtube/구글폼/링크 URL (퀴즈는 비워도 됨)
  "order" int default 1,
  required boolean default true,
  quiz jsonb,                  -- {"question":"...","options":["...","...","...","..."],"answer":0}
  created_at timestamptz default now()
);

-- 2) 학생(anon)이 읽을 수 있도록 RLS 설정
alter table missions enable row level security;

drop policy if exists "missions are readable by anyone" on missions;
create policy "missions are readable by anyone"
  on missions for select
  using (true);

-- =====================================================================
-- 3) 샘플 미션 데이터 (room_id = 'demo')
--    ssambus_missions.js 의 DEMO_MISSIONS 와 동일한 내용입니다.
--    이 데이터를 추가하면 데모 미션 대신 이 데이터가 우선 사용됩니다.
--    Supabase 테이블 편집기에서 직접 행을 추가/수정해 미션을 바꿔보세요.
-- =====================================================================

insert into missions (id, room_id, map_id, zone_id, title, type, content, "order", required, quiz) values
-- 일반교실
('demo_classroom_1', 'demo', 'classroom', 'zone_A', '수업 안내 영상 시청', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_classroom_2', 'demo', 'classroom', 'zone_B', '퀴즈: 교실 예절', 'quiz', null, 2, true,
  '{"question":"친구가 발표할 때 가장 알맞은 태도는 무엇일까요?","options":["딴짓을 한다","발표자를 바라보며 경청한다","옆 친구와 이야기한다","자리에서 일어나 돌아다닌다"],"answer":1}'),

-- 도서관
('demo_library_1', 'demo', 'library', 'zone_A', '도서관 이용 안내 영상', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_library_2', 'demo', 'library', 'zone_B', '퀴즈: 도서관 예절', 'quiz', null, 2, true,
  '{"question":"도서관에서 책을 다 읽은 후 가장 알맞은 행동은?","options":["아무 곳에나 두고 나간다","제자리에 정리한다","다른 칸에 숨겨둔다","바닥에 쌓아둔다"],"answer":1}'),

-- 운동장
('demo_playground_1', 'demo', 'playground', 'zone_A', '운동장 안전 영상', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_playground_2', 'demo', 'playground', 'zone_B', '퀴즈: 운동장 안전', 'quiz', null, 2, true,
  '{"question":"축구공이 다른 친구 쪽으로 빠르게 날아갈 때 가장 먼저 해야 할 일은?","options":["소리쳐서 알려준다","모른 척한다","더 세게 찬다","뛰어가서 잡는다"],"answer":0}'),

-- 체육관
('demo_gym_1', 'demo', 'gym', 'zone_A', '체육관 이용 안내 영상', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_gym_2', 'demo', 'gym', 'zone_B', '퀴즈: 체육 안전 수칙', 'quiz', null, 2, true,
  '{"question":"체육 활동을 시작하기 전에 가장 먼저 해야 할 일은?","options":["바로 전속력으로 달리기","준비 운동(스트레칭)","물 마시기 생략","신발 벗고 활동하기"],"answer":1}'),

-- 현대도시
('demo_city_1', 'demo', 'city', 'zone_A', '교통안전 영상', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_city_2', 'demo', 'city', 'zone_B', '퀴즈: 횡단보도 안전', 'quiz', null, 2, true,
  '{"question":"횡단보도를 건널 때 가장 알맞은 행동은?","options":["좌우를 살피지 않고 빠르게 건넌다","초록불이 켜지면 좌우를 살피고 건넌다","빨간불에도 차가 없으면 건넌다","휴대폰을 보며 건넌다"],"answer":1}'),

-- 자연숲
('demo_forest_1', 'demo', 'forest', 'zone_A', '자연 생태 안내 영상', 'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, null),
('demo_forest_2', 'demo', 'forest', 'zone_B', '퀴즈: 자연 보호', 'quiz', null, 2, true,
  '{"question":"숲에서 가져온 쓰레기는 어떻게 처리해야 할까요?","options":["숲 속에 묻는다","연못에 버린다","집까지 가져가 분리배출한다","나무 위에 걸어둔다"],"answer":2}')

on conflict (id) do nothing;
