-- ============================================================
--  전자서명 시스템 v6 — Supabase 스키마 (ssambus 프로젝트에 추가)
-- ------------------------------------------------------------
--  ★ Supabase SQL Editor에서 이 파일 전체를 한 번에 실행하세요.
--    ("Run without RLS" 선택 — RLS는 의도적으로 사용하지 않습니다.
--     대신 테이블 직접 권한을 전부 막고, 모든 접근을 아래 RPC
--     함수로만 허용해서 기관코드(org_key)를 몰라도 데이터를
--     건드릴 수 없게 막습니다. 관리 PIN이 필요한 동작은 각
--     함수 안에서 PIN을 검증합니다.)
-- ============================================================

-- ── 테이블 ──────────────────────────────────────────────────

create table if not exists institutions (
  org_key         text primary key,        -- Apps Script 배포 ID (연결 URL에서 추출)
  apps_script_url text not null,           -- 이미지 업로드용 배포 URL (전체)
  org_name        text not null default '',
  sub_title       text not null default '', -- 기관명 아래 작은 부제목, 비어있으면 화면에서 기본값('연수 참여 전자서명') 표시
  dept_list       text not null default '', -- 구성원명단이 비어있을 때 폴백용, 쉼표 구분
  notice          text not null default '',
  brand_color     text not null default '',
  admin_pin       text not null default '', -- 비어있으면 "최초 생성 필요" 상태
  created_at      timestamptz not null default now()
);

-- 기존 설치본에는 sub_title 컬럼이 없을 수 있으므로 안전하게 추가.
alter table institutions add column if not exists sub_title text not null default '';

create table if not exists staff (
  id       bigserial primary key,
  org_key  text not null references institutions(org_key) on delete cascade,
  dept     text not null default '',
  name     text not null
);

create table if not exists trainings (
  id             bigserial primary key,
  org_key        text not null references institutions(org_key) on delete cascade,
  active         boolean not null default true,
  title          text not null,
  content        text not null default '',
  training_date  text not null,   -- 'yyyy-MM-dd' 또는 '매일'
  sort_order     integer,         -- 연수 목록 표시 순서 (관리자 패널에서 위/아래로 변경)
  created_at     timestamptz not null default now()
);

-- 기존 설치본에는 sort_order 컬럼이 없을 수 있으므로 안전하게 추가 후,
-- 비어있는 값은 등록 순서(id)로 초기화한다.
alter table trainings add column if not exists sort_order integer;
update trainings set sort_order = id where sort_order is null;

-- 서명 가능 시간대(선택). 둘 다 NULL이면 시간 제한 없이 하루 종일 서명 가능.
alter table trainings add column if not exists start_time time;
alter table trainings add column if not exists end_time   time;

create table if not exists signatures (
  id             bigserial primary key,
  org_key        text not null references institutions(org_key) on delete cascade,
  sign_date      date not null,
  sign_time      time not null,
  training_title text not null,
  department     text not null default '',
  name           text not null,
  image_file_id  text not null,
  image_url      text not null,
  created_at     timestamptz not null default now(),
  unique (org_key, sign_date, training_title, name)
);

create index if not exists idx_staff_org           on staff(org_key);
create index if not exists idx_trainings_org       on trainings(org_key);
create index if not exists idx_signatures_org_date on signatures(org_key, sign_date, training_title);

-- ── 테이블 직접 권한 전면 차단 ──────────────────────────────
-- anon/authenticated는 테이블을 직접 SELECT/INSERT/UPDATE/DELETE 할 수 없다.
-- 모든 접근은 아래 SECURITY DEFINER 함수를 통해서만 이뤄진다.
revoke all on institutions, staff, trainings, signatures from anon, authenticated;

-- ============================================================
--  공개 함수 (PIN 불필요) — 서명 화면에서 사용
-- ============================================================

-- 기관 최초 연결 (없으면 생성, 있으면 URL만 갱신)
create or replace function register_institution(p_org_key text, p_apps_script_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row institutions;
begin
  insert into institutions (org_key, apps_script_url)
  values (p_org_key, p_apps_script_url)
  on conflict (org_key) do update set apps_script_url = excluded.apps_script_url
  returning * into v_row;

  return jsonb_build_object(
    'success', true,
    'orgName', v_row.org_name,
    'pinSet', (v_row.admin_pin <> '')
  );
end;
$$;

-- 서명 화면 진입 시 필요한 공개 정보 한 번에 반환 (기존 getPageData 대응)
create or replace function get_page_data(p_org_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst institutions;
  v_today text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD');
begin
  select * into v_inst from institutions where org_key = p_org_key;
  if not found then
    return jsonb_build_object('orgName','','subTitle','','staff','[]'::jsonb,'trainings','[]'::jsonb,'notice','','brandColor','','printPinSet',false);
  end if;

  return jsonb_build_object(
    'orgName',     v_inst.org_name,
    'subTitle',    v_inst.sub_title,
    'deptList',    v_inst.dept_list,
    'notice',      v_inst.notice,
    'brandColor',  v_inst.brand_color,
    'printPinSet', (v_inst.admin_pin <> ''),
    'staff', (
      select coalesce(jsonb_agg(jsonb_build_object('dept', dept, 'name', name) order by id), '[]'::jsonb)
      from staff where org_key = p_org_key
    ),
    'trainings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'title', title, 'content', content,
        'startTime', to_char(start_time, 'HH24:MI'), 'endTime', to_char(end_time, 'HH24:MI')
      ) order by sort_order, id), '[]'::jsonb)
      from trainings
      where org_key = p_org_key and active
        and (training_date = v_today or training_date = '매일')
    )
  );
end;
$$;

-- 서명 제출 (중복이면 duplicate:true, 서명 가능 시간이 아니면 timeBlocked:true 반환
-- UNIQUE 제약 + 서버 시각(now()) 기준 시간대 검사가 최종 방어선 — 클라이언트 시각은 신뢰하지 않는다)
create or replace function submit_signature(
  p_org_key text, p_sign_date date, p_sign_time time,
  p_training_title text, p_department text, p_name text,
  p_image_file_id text, p_image_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start time;
  v_end   time;
  v_now   time := (now() at time zone 'Asia/Seoul')::time;
begin
  select start_time, end_time into v_start, v_end
  from trainings
  where org_key = p_org_key and title = p_training_title and active
    and (training_date = p_sign_date::text or training_date = '매일')
  order by (training_date = p_sign_date::text) desc
  limit 1;

  if v_start is not null and v_now < v_start then
    return jsonb_build_object('success', false, 'timeBlocked', true,
      'message', '[' || p_training_title || '] 아직 서명 가능 시간이 아닙니다. (' || to_char(v_start, 'HH24:MI') || '부터)');
  end if;
  if v_end is not null and v_now > v_end then
    return jsonb_build_object('success', false, 'timeBlocked', true,
      'message', '[' || p_training_title || '] 서명 가능 시간이 종료되었습니다. (' || to_char(v_end, 'HH24:MI') || '까지)');
  end if;

  insert into signatures (org_key, sign_date, sign_time, training_title, department, name, image_file_id, image_url)
  values (p_org_key, p_sign_date, p_sign_time, p_training_title, p_department, p_name, p_image_file_id, p_image_url);
  return jsonb_build_object('success', true);
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'duplicate', true,
      'message', '[' || p_training_title || '] ' || p_name || '님은 이미 서명을 완료하셨습니다.');
end;
$$;

-- 서명등록부 출력용 기록 조회 (출력 비밀번호가 설정된 경우 PIN 검증)
create or replace function get_signature_records(p_org_key text, p_title text, p_date date, p_pin text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_pin text;
begin
  select admin_pin into v_admin_pin from institutions where org_key = p_org_key;
  if v_admin_pin is not null and v_admin_pin <> '' and coalesce(p_pin,'') <> v_admin_pin then
    return jsonb_build_object('success', false, 'needPin', true, 'records', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'success', true,
    'title', p_title,
    'date', p_date,
    'records', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'department', department, 'name', name,
        'time', to_char(sign_time, 'HH24:MI:SS'),
        'fileId', image_file_id
      ) order by created_at), '[]'::jsonb)
      from signatures
      where org_key = p_org_key and training_title = p_title and sign_date = p_date
    )
  );
end;
$$;

-- 서명 기록 삭제 (관리자 패널의 [서명 기록] 탭 전용, PIN 검증)
-- ※ 드라이브에 저장된 이미지 파일 자체는 지우지 않고, Supabase의 기록(행)만 삭제한다.
create or replace function delete_signature(p_org_key text, p_pin text, p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  delete from signatures where id = p_id and org_key = p_org_key;
  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
--  관리자 함수 (PIN 필요 — 각 함수 내부에서 검증)
-- ============================================================

-- 관리자 PIN 최초 생성 (이미 설정되어 있으면 거부)
create or replace function set_admin_pin(p_org_key text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if length(coalesce(p_pin,'')) < 4 then
    return jsonb_build_object('success', false, 'message', '비밀번호는 4자 이상이어야 합니다.');
  end if;

  select admin_pin into v_current from institutions where org_key = p_org_key;
  if v_current is null then
    return jsonb_build_object('success', false, 'message', '연결된 기관 정보를 찾을 수 없습니다.');
  end if;
  if v_current <> '' then
    return jsonb_build_object('success', false, 'message', '이미 관리자 비밀번호가 설정되어 있습니다.');
  end if;

  update institutions set admin_pin = p_pin where org_key = p_org_key;
  return jsonb_build_object('success', true);
end;
$$;

-- 관리자 비밀번호 변경 (기존 비밀번호 확인 후 교체 — 기관 설정 탭에서 사용)
create or replace function change_admin_pin(p_org_key text, p_pin text, p_new_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  if length(coalesce(p_new_pin, '')) < 4 then
    return jsonb_build_object('success', false, 'message', '새 비밀번호는 4자 이상이어야 합니다.');
  end if;

  update institutions set admin_pin = p_new_pin where org_key = p_org_key;
  return jsonb_build_object('success', true);
end;
$$;

-- 내부 헬퍼: PIN 검증 (틀리면 예외)
create or replace function _check_admin_pin(p_org_key text, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  select admin_pin into v_current from institutions where org_key = p_org_key;
  if v_current is null or v_current = '' or coalesce(p_pin,'') <> v_current then
    raise exception 'NEED_PIN';
  end if;
end;
$$;

-- 내부 헬퍼: 특정 기관의 연수/구성원 전체 목록을 jsonb로 (중복 방지용 공통화)
create or replace function _trainings_json(p_org_key text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'active', active, 'title', title, 'content', content, 'date', training_date,
    'startTime', to_char(start_time, 'HH24:MI'), 'endTime', to_char(end_time, 'HH24:MI')
  ) order by sort_order, id), '[]'::jsonb)
  from trainings where org_key = p_org_key;
$$;

create or replace function _staff_json(p_org_key text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dept', dept, 'name', name) order by id), '[]'::jsonb)
  from staff where org_key = p_org_key;
$$;

-- 관리자 패널 전체 데이터 (구성원 전체 + 연수 전체(비활성 포함) + 기관 설정)
create or replace function get_admin_data(p_org_key text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst institutions;
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  select * into v_inst from institutions where org_key = p_org_key;

  return jsonb_build_object(
    'success', true,
    'orgName', v_inst.org_name, 'subTitle', v_inst.sub_title, 'deptList', v_inst.dept_list,
    'notice', v_inst.notice, 'brandColor', v_inst.brand_color,
    'staff', _staff_json(p_org_key),
    'trainings', _trainings_json(p_org_key)
  );
end;
$$;

-- 재배포 시 시그니처 충돌(오버로드 모호성) 방지: 구버전 함수 명시적 제거
drop function if exists save_training(text, text, bigint, text, text, text, boolean);

-- 연수 추가/수정 (id가 NULL이면 추가, 있으면 수정)
-- p_start_time/p_end_time: 'HH:MM' 형식, 둘 다 비우면 하루 종일 서명 가능
create or replace function save_training(
  p_org_key text, p_pin text, p_id bigint,
  p_title text, p_content text, p_date text, p_active boolean,
  p_start_time text default null, p_end_time text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start time;
  v_end   time;
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  if coalesce(trim(p_title), '') = '' then
    return jsonb_build_object('success', false, 'message', '연수명을 입력해 주세요.');
  end if;
  if coalesce(trim(p_date), '') = '' then
    return jsonb_build_object('success', false, 'message', '연수 날짜를 선택해 주세요.');
  end if;

  begin
    v_start := nullif(trim(p_start_time), '')::time;
    v_end   := nullif(trim(p_end_time), '')::time;
  exception when others then
    return jsonb_build_object('success', false, 'message', '서명 가능 시간 형식이 올바르지 않습니다.');
  end;
  if v_end is not null and v_start is null then
    return jsonb_build_object('success', false, 'message', '시작 시간을 입력해 주세요.');
  end if;
  if v_start is not null and v_end is not null and v_end <= v_start then
    return jsonb_build_object('success', false, 'message', '종료 시간이 시작 시간보다 빨라요.');
  end if;

  if p_id is null then
    insert into trainings (org_key, active, title, content, training_date, start_time, end_time, sort_order)
    values (
      p_org_key, coalesce(p_active, true), p_title, coalesce(p_content,''), p_date, v_start, v_end,
      coalesce((select max(sort_order) from trainings where org_key = p_org_key), 0) + 1
    );
  else
    update trainings set
      active = coalesce(p_active, true),
      title = p_title,
      content = coalesce(p_content, ''),
      training_date = p_date,
      start_time = v_start,
      end_time = v_end
    where id = p_id and org_key = p_org_key;
  end if;

  return jsonb_build_object('success', true, 'trainings', _trainings_json(p_org_key));
end;
$$;

create or replace function delete_training(p_org_key text, p_pin text, p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  delete from trainings where id = p_id and org_key = p_org_key;
  return jsonb_build_object('success', true, 'trainings', _trainings_json(p_org_key));
end;
$$;

-- 연수 순서 변경 (관리자 패널의 위/아래 버튼 전용 — 바로 위/아래 연수와 순서를 맞바꾼다)
create or replace function move_training(p_org_key text, p_pin text, p_id bigint, p_direction text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur_order integer;
  v_neighbor  trainings;
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  select sort_order into v_cur_order from trainings where id = p_id and org_key = p_org_key;
  if v_cur_order is null then
    return jsonb_build_object('success', false, 'message', '연수를 찾을 수 없습니다.');
  end if;

  if p_direction = 'up' then
    select * into v_neighbor from trainings
    where org_key = p_org_key and sort_order < v_cur_order
    order by sort_order desc limit 1;
  else
    select * into v_neighbor from trainings
    where org_key = p_org_key and sort_order > v_cur_order
    order by sort_order asc limit 1;
  end if;

  if not found then
    -- 이미 맨 위(또는 맨 아래)라 바꿀 상대가 없음 — 조용히 현재 목록만 반환
    return jsonb_build_object('success', true, 'trainings', _trainings_json(p_org_key));
  end if;

  update trainings set sort_order = v_neighbor.sort_order where id = p_id and org_key = p_org_key;
  update trainings set sort_order = v_cur_order where id = v_neighbor.id and org_key = p_org_key;

  return jsonb_build_object('success', true, 'trainings', _trainings_json(p_org_key));
end;
$$;

-- 구성원 추가/수정
create or replace function save_staff(
  p_org_key text, p_pin text, p_id bigint, p_dept text, p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', '성명을 입력해 주세요.');
  end if;

  if p_id is null then
    insert into staff (org_key, dept, name) values (p_org_key, coalesce(p_dept,''), p_name);
  else
    update staff set dept = coalesce(p_dept,''), name = p_name
    where id = p_id and org_key = p_org_key;
  end if;

  return jsonb_build_object('success', true, 'staff', _staff_json(p_org_key));
end;
$$;

create or replace function delete_staff(p_org_key text, p_pin text, p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  delete from staff where id = p_id and org_key = p_org_key;
  return jsonb_build_object('success', true, 'staff', _staff_json(p_org_key));
end;
$$;

-- 구성원 일괄 등록 (같은 부서에 여러 명 — 엑셀 복붙 등)
create or replace function bulk_add_staff(p_org_key text, p_pin text, p_dept text, p_names text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_count int := 0;
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  foreach v_name in array coalesce(p_names, '{}') loop
    if coalesce(trim(v_name), '') <> '' then
      insert into staff (org_key, dept, name) values (p_org_key, coalesce(p_dept, ''), trim(v_name));
      v_count := v_count + 1;
    end if;
  end loop;

  if v_count = 0 then
    return jsonb_build_object('success', false, 'message', '성명을 한 명 이상 입력해 주세요.');
  end if;

  return jsonb_build_object('success', true, 'addedCount', v_count, 'staff', _staff_json(p_org_key));
end;
$$;

-- 부서명 일괄 변경 (해당 부서 구성원 전원)
create or replace function rename_dept(p_org_key text, p_pin text, p_old_dept text, p_new_dept text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  if coalesce(trim(p_new_dept), '') = '' then
    return jsonb_build_object('success', false, 'message', '새 부서명을 입력해 주세요.');
  end if;

  update staff set dept = trim(p_new_dept)
  where org_key = p_org_key and dept = coalesce(p_old_dept, '');

  return jsonb_build_object('success', true, 'staff', _staff_json(p_org_key));
end;
$$;

-- 기관 설정(기관명/부서목록/안내문/대표색상) 수정
-- 재배포 시 시그니처 충돌(오버로드 모호성) 방지: 구버전 함수 명시적 제거
drop function if exists update_org_settings(text, text, text, text, text, text);

create or replace function update_org_settings(
  p_org_key text, p_pin text,
  p_org_name text, p_dept_list text, p_notice text, p_brand_color text,
  p_sub_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform _check_admin_pin(p_org_key, p_pin);
  exception when others then
    return jsonb_build_object('success', false, 'needPin', true);
  end;

  update institutions set
    org_name    = coalesce(p_org_name, org_name),
    sub_title   = coalesce(p_sub_title, sub_title),
    dept_list   = coalesce(p_dept_list, dept_list),
    notice      = coalesce(p_notice, notice),
    brand_color = coalesce(p_brand_color, brand_color)
  where org_key = p_org_key;

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
--  아카이브 함수 (service_role 전용 — GitHub Actions 등 서버 환경에서만 호출.
--  anon 키로는 절대 실행 불가하도록 아래에서 EXECUTE 권한을 명시적으로 제한함)
--  ※ 이 기능의 실제 스케줄 연동(GitHub Actions)은 이번 구현 범위에서 제외 —
--    함수만 미리 준비해두고, 자동화는 추후 별도 진행.
-- ============================================================
create or replace function archive_old_signatures(p_org_key text, p_cutoff_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
  v_count int;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
           'date', sign_date, 'time', sign_time, 'trainingTitle', training_title,
           'department', department, 'name', name, 'imageUrl', image_url
         ) order by sign_date, created_at), '[]'::jsonb),
         count(*)
  into v_rows, v_count
  from signatures
  where org_key = p_org_key and sign_date < p_cutoff_date;

  delete from signatures where org_key = p_org_key and sign_date < p_cutoff_date;

  return jsonb_build_object('success', true, 'archivedCount', v_count, 'rows', v_rows);
end;
$$;

-- ── 컬럼 단위 보호: admin_pin은 그 어떤 role도 직접 SELECT 불가 ─
-- (institutions 테이블 자체는 위에서 이미 REVOKE ALL 되어 있으므로
--  이 REVOKE는 이중 안전장치. get_page_data/get_admin_data 등은
--  SECURITY DEFINER라 이 제한과 무관하게 정상 동작함)
revoke select (admin_pin) on institutions from anon, authenticated;

-- ── 함수 실행 권한 ───────────────────────────────────────────
-- ⚠️ Supabase는 default privileges로 새 함수에 anon/authenticated 직접
--    실행 권한을 자동 부여하므로, PUBLIC뿐 아니라 anon/authenticated에게서도
--    명시적으로 회수해야 한다. 그 뒤 필요한 함수만 다시 부여.
revoke execute on function
  register_institution(text, text),
  get_page_data(text),
  submit_signature(text, date, time, text, text, text, text, text),
  get_signature_records(text, text, date, text),
  set_admin_pin(text, text),
  change_admin_pin(text, text, text),
  _check_admin_pin(text, text),
  _trainings_json(text),
  _staff_json(text),
  get_admin_data(text, text),
  save_training(text, text, bigint, text, text, text, boolean, text, text),
  delete_training(text, text, bigint),
  move_training(text, text, bigint, text),
  save_staff(text, text, bigint, text, text),
  delete_staff(text, text, bigint),
  bulk_add_staff(text, text, text, text[]),
  rename_dept(text, text, text, text),
  update_org_settings(text, text, text, text, text, text, text),
  delete_signature(text, text, bigint),
  archive_old_signatures(text, date)
from public, anon, authenticated;

grant execute on function
  register_institution(text, text),
  get_page_data(text),
  submit_signature(text, date, time, text, text, text, text, text),
  get_signature_records(text, text, date, text),
  set_admin_pin(text, text),
  change_admin_pin(text, text, text),
  get_admin_data(text, text),
  save_training(text, text, bigint, text, text, text, boolean, text, text),
  delete_training(text, text, bigint),
  move_training(text, text, bigint, text),
  save_staff(text, text, bigint, text, text),
  delete_staff(text, text, bigint),
  bulk_add_staff(text, text, text, text[]),
  rename_dept(text, text, text, text),
  update_org_settings(text, text, text, text, text, text, text),
  delete_signature(text, text, bigint)
to anon, authenticated;

-- _check_admin_pin / _trainings_json / _staff_json 은 내부 헬퍼일 뿐이라
-- anon/authenticated에게 부여하지 않음 (PIN 없이 전체 목록이 새어나가는 것을 방지).
-- archive_old_signatures는 service_role(GitHub Actions 등 서버 환경) 전용.
grant execute on function archive_old_signatures(text, date) to service_role;
