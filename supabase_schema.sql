-- =============================================================
--  입시연구소 (v45) · Supabase 스키마 — 프론트엔드 호출 기준 역설계본
--  Supabase 대시보드 > SQL Editor 에 "통째로" 붙여넣고 Run 하세요.
--  여러 번 실행해도 안전하도록 (idempotent) 작성했습니다.
--
--  ⚠️ 채점/메달/랭킹 RPC 본문은 화면 동작에서 추론한 "동작하는 기본형"입니다.
--     - 점수 = 맞은 문항의 배점(points) 합
--     - 메달 = 마감(close_test) 시 상위 1·2·3등 + 만점자에게 지급
--     학원 실제 규칙(영역별 배점·표준점수·등급컷·난이도 보상)이 다르면
--     submit_answers / close_test 두 함수만 고치면 됩니다.
-- =============================================================

-- ── 0. 역할 ENUM ─────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('director','teacher','student');
exception when duplicate_object then null; end $$;

-- ── 1. 반(클래스) ────────────────────────────────────────────
create table if not exists classes (
  id   bigint generated always as identity primary key,
  name text not null unique
);

-- ── 2. 프로필 (auth.users 와 1:1) ────────────────────────────
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text,
  nickname         text,
  student_no       int,
  role             user_role not null default 'student',
  class_id         bigint references classes(id) on delete set null,
  teacher_id       uuid references profiles(id) on delete set null,
  initial_password text,        -- 최초 발급 비번(교사/원장 안내용, 학생이 바꾸면 무의미)
  pw_changed       boolean not null default false,
  created_at       timestamptz default now()
);

-- ── 3. 시험 ──────────────────────────────────────────────────
--   answers : 정답키 배열(jsonb)  예) ["3","1","45",...]  (주관식은 문자열)
--   types   : 문항유형 배열       예) ["mc","mc","sub",...]  (mc=객관식, sub=주관식)
--   points  : 문항배점 배열       예) [2,2,3,...]
--   levels  : 문항난이도 배열     예) ["nor","jun","kill","god",...]
--   total   : 문항 수
--   closed  : 마감 여부 (마감되면 제출 불가 + 메달 지급)
create table if not exists tests (
  id         bigint generated always as identity primary key,
  title      text not null,
  exam_date  date default current_date,
  answers    jsonb not null default '[]',
  types      jsonb not null default '[]',
  points     jsonb not null default '[]',
  levels     jsonb not null default '[]',
  total      int  not null default 0,
  closed     boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ── 4. 시험 배정 (어떤 학생이 어떤 시험을 보는지) ────────────
create table if not exists test_assignments (
  test_id bigint not null references tests(id) on delete cascade,
  user_id uuid   not null references auth.users(id) on delete cascade,
  primary key (test_id, user_id)
);

-- ── 5. 제출(답안) ────────────────────────────────────────────
--   answers : 학생이 낸 답 배열(jsonb)
--   한 학생당 한 시험 1회 제출 (unique)
create table if not exists submissions (
  id            bigint generated always as identity primary key,
  test_id       bigint not null references tests(id) on delete cascade,
  user_id       uuid   not null references auth.users(id) on delete cascade,
  answers       jsonb  not null default '[]',
  score         int    not null default 0,
  correct_count int    not null default 0,
  created_at    timestamptz default now(),
  unique (test_id, user_id)
);

-- ── 6. 개인 D-day ────────────────────────────────────────────
create table if not exists personal_ddays (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title   text not null,
  date    date not null,
  icon    text
);

-- ── 7. 컬렉션(메달/난이도 아이콘 누적) ───────────────────────
create table if not exists collections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  jun     int not null default 0,  -- 준킬러
  kill    int not null default 0,  -- 킬러
  god     int not null default 0,  -- GOD
  gold    int not null default 0,  -- 🥇
  silver  int not null default 0,  -- 🥈
  bronze  int not null default 0,  -- 🥉
  perfect int not null default 0   -- 💎 만점
);

-- =============================================================
--  보조 함수 (RLS·RPC 에서 공통 사용)
-- =============================================================

-- 현재 로그인 사용자가 교사/원장인지
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('teacher','director')
  );
$$;

-- 현재 사용자의 반 id
create or replace function my_class_id()
returns bigint language sql stable security definer set search_path = public as $$
  select class_id from profiles where id = auth.uid();
$$;

-- =============================================================
--  신규 가입 시 profiles 자동 생성 트리거
-- =============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), 'student')
  on conflict (id) do nothing;
  insert into collections (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================
--  RLS (행 수준 보안) — 모든 테이블에 켭니다
-- =============================================================
alter table classes          enable row level security;
alter table profiles         enable row level security;
alter table tests            enable row level security;
alter table test_assignments enable row level security;
alter table submissions      enable row level security;
alter table personal_ddays   enable row level security;
alter table collections      enable row level security;

-- 정책 재실행 안전하게: 같은 이름 있으면 지우고 다시
-- classes : 로그인 사용자는 읽기, 교사/원장만 쓰기
drop policy if exists classes_read  on classes;
drop policy if exists classes_write on classes;
create policy classes_read  on classes for select to authenticated using (true);
create policy classes_write on classes for all    to authenticated using (is_staff()) with check (is_staff());

-- profiles : 본인은 본인 행, 교사/원장은 전체 읽기 / 본인 일부 수정은 RPC로 처리
drop policy if exists profiles_self_read on profiles;
drop policy if exists profiles_staff_read on profiles;
drop policy if exists profiles_self_update on profiles;
drop policy if exists profiles_staff_all on profiles;
create policy profiles_self_read  on profiles for select to authenticated using (id = auth.uid());
create policy profiles_staff_read on profiles for select to authenticated using (is_staff());
create policy profiles_self_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_all  on profiles for all to authenticated using (is_staff()) with check (is_staff());

-- tests : 학생은 자신에게 배정된 시험만, 교사/원장은 전체
drop policy if exists tests_read on tests;
drop policy if exists tests_staff_all on tests;
create policy tests_read on tests for select to authenticated
  using (
    is_staff()
    or exists (select 1 from test_assignments a where a.test_id = tests.id and a.user_id = auth.uid())
  );
create policy tests_staff_all on tests for all to authenticated using (is_staff()) with check (is_staff());

-- test_assignments : 본인 것 읽기, 교사/원장 전체 관리
drop policy if exists ta_self_read on test_assignments;
drop policy if exists ta_staff_all on test_assignments;
create policy ta_self_read on test_assignments for select to authenticated using (user_id = auth.uid() or is_staff());
create policy ta_staff_all on test_assignments for all to authenticated using (is_staff()) with check (is_staff());

-- submissions : 본인 것 읽기, 교사/원장 전체 읽기. 쓰기는 RPC(submit_answers)로만.
drop policy if exists sub_self_read on submissions;
drop policy if exists sub_staff_read on submissions;
create policy sub_self_read  on submissions for select to authenticated using (user_id = auth.uid());
create policy sub_staff_read on submissions for select to authenticated using (is_staff());

-- personal_ddays : 완전 본인 소유
drop policy if exists dday_owner on personal_ddays;
create policy dday_owner on personal_ddays for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- collections : 본인 읽기, 교사/원장 읽기. 쓰기는 RPC로만.
drop policy if exists col_self_read on collections;
drop policy if exists col_staff_read on collections;
create policy col_self_read  on collections for select to authenticated using (user_id = auth.uid());
create policy col_staff_read on collections for select to authenticated using (is_staff());

-- =============================================================
--  RPC 1) 본인 이름·반 최초 설정 (1회성)
-- =============================================================
create or replace function set_my_profile(p_name text, p_class_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles
     set name = p_name,
         class_id = p_class_id
   where id = auth.uid();
end; $$;

-- =============================================================
--  RPC 2) 닉네임 변경 (명예의 전당 표시용)
-- =============================================================
create or replace function set_my_nickname(p_nick text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set nickname = nullif(p_nick,'') where id = auth.uid();
end; $$;

-- =============================================================
--  RPC 3) 답안 제출 + 채점
--    p_answers : 학생이 낸 답(text[]). 빈칸은 ''.
--    점수 = 맞은 문항의 배점 합, correct_count = 맞은 개수.
--    이미 제출했거나 마감된 시험이면 예외.
-- =============================================================
create or replace function submit_answers(p_test_id bigint, p_answers text[])
returns void language plpgsql security definer set search_path = public as $$
declare
  t          tests%rowtype;
  i          int;
  key_arr    text[];
  pts_arr    int[];
  v_score    int := 0;
  v_correct  int := 0;
begin
  select * into t from tests where id = p_test_id;
  if not found then raise exception '시험을 찾을 수 없습니다'; end if;
  if t.closed then raise exception '마감된 시험입니다'; end if;

  -- 본인에게 배정된 시험인지 확인 (교사/원장은 통과)
  if not is_staff() and not exists (
      select 1 from test_assignments a where a.test_id = p_test_id and a.user_id = auth.uid()) then
    raise exception '배정되지 않은 시험입니다';
  end if;

  if exists (select 1 from submissions s where s.test_id = p_test_id and s.user_id = auth.uid()) then
    raise exception '이미 제출한 시험입니다';
  end if;

  -- jsonb 배열 → text[] / int[]
  select array(select jsonb_array_elements_text(t.answers)) into key_arr;
  select array(select (jsonb_array_elements_text(t.points))::int) into pts_arr;

  for i in 1 .. greatest(coalesce(array_length(key_arr,1),0), coalesce(t.total,0)) loop
    if i <= coalesce(array_length(p_answers,1),0)
       and i <= coalesce(array_length(key_arr,1),0)
       and btrim(p_answers[i]) <> ''
       and btrim(p_answers[i]) = btrim(key_arr[i]) then
      v_correct := v_correct + 1;
      v_score   := v_score + coalesce(pts_arr[i], 1);
    end if;
  end loop;

  insert into submissions (test_id, user_id, answers, score, correct_count)
  values (p_test_id, auth.uid(), to_jsonb(p_answers), v_score, v_correct);
end; $$;

-- =============================================================
--  RPC 4) 내가 틀린 문항 목록
--    반환: item_idx(1부터), item_points
-- =============================================================
create or replace function my_wrong_items(p_test_id bigint)
returns table(item_idx int, item_points int)
language plpgsql security definer set search_path = public as $$
declare
  t        tests%rowtype;
  s        submissions%rowtype;
  key_arr  text[];
  pts_arr  int[];
  ans_arr  text[];
  i        int;
begin
  select * into t from tests where id = p_test_id;
  select * into s from submissions where test_id = p_test_id and user_id = auth.uid();
  if not found then return; end if;

  select array(select jsonb_array_elements_text(t.answers))      into key_arr;
  select array(select (jsonb_array_elements_text(t.points))::int) into pts_arr;
  select array(select jsonb_array_elements_text(s.answers))      into ans_arr;

  for i in 1 .. coalesce(array_length(key_arr,1),0) loop
    if i > coalesce(array_length(ans_arr,1),0)
       or btrim(coalesce(ans_arr[i],'')) = ''
       or btrim(ans_arr[i]) <> btrim(key_arr[i]) then
      item_idx := i;
      item_points := coalesce(pts_arr[i], 1);
      return next;
    end if;
  end loop;
end; $$;

-- =============================================================
--  RPC 5) 내 등수 (전체 + 반내)
--    반환: score, overall_rank, overall_total, class_rank, class_total
-- =============================================================
create or replace function my_rank(p_test_id bigint)
returns table(score int, overall_rank int, overall_total int, class_rank int, class_total int)
language plpgsql security definer set search_path = public as $$
declare
  v_cls bigint;
begin
  select class_id into v_cls from profiles where id = auth.uid();

  return query
  with ranked as (
    select s.user_id, s.score,
           rank() over (order by s.score desc) as o_rank,
           count(*) over () as o_total
    from submissions s
    where s.test_id = p_test_id
  ),
  cls as (
    select s.user_id, s.score,
           rank() over (order by s.score desc) as c_rank,
           count(*) over () as c_total
    from submissions s
    join profiles p on p.id = s.user_id
    where s.test_id = p_test_id and p.class_id = v_cls
  )
  select r.score::int, r.o_rank::int, r.o_total::int,
         c.c_rank::int, c.c_total::int
  from ranked r
  left join cls c on c.user_id = r.user_id
  where r.user_id = auth.uid();
end; $$;

-- =============================================================
--  RPC 6) 명예의 전당 (회차별 TOP 3, 전체 + 반)
--    반환: scope('overall'|'class'), rnk, display_name, score
--    display_name = 닉네임(없으면 '익명')
-- =============================================================
create or replace function hall_of_fame(p_test_id bigint)
returns table(scope text, rnk int, display_name text, score int)
language plpgsql security definer set search_path = public as $$
declare
  v_cls bigint;
begin
  select class_id into v_cls from profiles where id = auth.uid();

  -- 전체 TOP 3
  return query
  select 'overall'::text, r.rnk::int, coalesce(nullif(p.nickname,''),'익명'), r.score::int
  from (
    select s.user_id, s.score, rank() over (order by s.score desc) rnk
    from submissions s where s.test_id = p_test_id
  ) r
  join profiles p on p.id = r.user_id
  where r.rnk <= 3
  order by r.rnk;

  -- 우리 반 TOP 3
  return query
  select 'class'::text, r.rnk::int, coalesce(nullif(p.nickname,''),'익명'), r.score::int
  from (
    select s.user_id, s.score, rank() over (order by s.score desc) rnk
    from submissions s
    join profiles pp on pp.id = s.user_id
    where s.test_id = p_test_id and pp.class_id = v_cls
  ) r
  join profiles p on p.id = r.user_id
  where r.rnk <= 3
  order by r.rnk;
end; $$;

-- =============================================================
--  RPC 7) 학생 리포트 (교사/원장 전용)
--    반환: 해당 학생의 회차별 점수 추이
-- =============================================================
create or replace function student_report(p_student uuid)
returns table(test_id bigint, title text, exam_date date, score int, correct_count int, total int)
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  return query
  select t.id, t.title, t.exam_date, s.score, s.correct_count, t.total
  from submissions s
  join tests t on t.id = s.test_id
  where s.user_id = p_student
  order by t.exam_date asc, t.id asc;
end; $$;

-- =============================================================
--  RPC 8) 시험 마감 + 메달 지급 (교사/원장 전용)
--    상위 1·2·3등 → gold/silver/bronze, 만점 → perfect
--    난이도 보상(jun/kill/god)은 학원 규칙에 맞게 아래 주석 부분 확장
-- =============================================================
create or replace function close_test(p_test_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  t       tests%rowtype;
  maxpts  int;
  rec     record;
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;

  select * into t from tests where id = p_test_id;
  if not found then raise exception '시험을 찾을 수 없습니다'; end if;

  update tests set closed = true where id = p_test_id;

  -- 만점 기준(배점 합)
  select coalesce((select sum(x::int) from jsonb_array_elements_text(t.points) as x),0)
    into maxpts;

  -- 등수별/만점 메달 지급
  for rec in
    select s.user_id, s.score,
           rank() over (order by s.score desc) rnk
    from submissions s where s.test_id = p_test_id
  loop
    insert into collections (user_id) values (rec.user_id) on conflict do nothing;
    if rec.rnk = 1 then
      update collections set gold = gold + 1 where user_id = rec.user_id;
    elsif rec.rnk = 2 then
      update collections set silver = silver + 1 where user_id = rec.user_id;
    elsif rec.rnk = 3 then
      update collections set bronze = bronze + 1 where user_id = rec.user_id;
    end if;
    if maxpts > 0 and rec.score >= maxpts then
      update collections set perfect = perfect + 1 where user_id = rec.user_id;
    end if;
  end loop;

  -- (선택) 난이도 아이콘 보상 예시 — 킬러/준킬러/GOD 문항을 맞힌 학생에게 지급하려면
  -- levels 배열과 submissions.answers 를 비교해 카운트 업데이트하는 로직을 여기에 추가.
end; $$;

-- =============================================================
--  RPC 9) 교사 답안 수정 + 재채점 (교사/원장 전용)
-- =============================================================
create or replace function teacher_regrade(p_test_id bigint, p_user_id uuid, p_answers text[])
returns void language plpgsql security definer set search_path = public as $$
declare
  t         tests%rowtype;
  i         int;
  key_arr   text[];
  pts_arr   int[];
  v_score   int := 0;
  v_correct int := 0;
begin
  if not is_staff() then raise exception '권한이 없습니다'; end if;
  select * into t from tests where id = p_test_id;
  if not found then raise exception '시험을 찾을 수 없습니다'; end if;

  select array(select jsonb_array_elements_text(t.answers))       into key_arr;
  select array(select (jsonb_array_elements_text(t.points))::int) into pts_arr;

  for i in 1 .. coalesce(array_length(key_arr,1),0) loop
    if i <= coalesce(array_length(p_answers,1),0)
       and btrim(p_answers[i]) <> ''
       and btrim(p_answers[i]) = btrim(key_arr[i]) then
      v_correct := v_correct + 1;
      v_score   := v_score + coalesce(pts_arr[i], 1);
    end if;
  end loop;

  insert into submissions (test_id, user_id, answers, score, correct_count)
  values (p_test_id, p_user_id, to_jsonb(p_answers), v_score, v_correct)
  on conflict (test_id, user_id)
  do update set answers = excluded.answers,
                score = excluded.score,
                correct_count = excluded.correct_count;
end; $$;

-- =============================================================
--  실행 권한 부여 (authenticated 가 RPC 호출 가능하도록)
-- =============================================================
grant execute on function set_my_profile(text,bigint)         to authenticated;
grant execute on function set_my_nickname(text)               to authenticated;
grant execute on function submit_answers(bigint,text[])       to authenticated;
grant execute on function my_wrong_items(bigint)              to authenticated;
grant execute on function my_rank(bigint)                     to authenticated;
grant execute on function hall_of_fame(bigint)                to authenticated;
grant execute on function student_report(uuid)               to authenticated;
grant execute on function close_test(bigint)                  to authenticated;
grant execute on function teacher_regrade(bigint,uuid,text[]) to authenticated;

-- =============================================================
--  끝. 다음 단계:
--   1) Authentication → Users → Add user 로 본인(원장) 계정 생성
--   2) 아래로 원장 승격:
--      update profiles set role='director', name='원장'
--      where id = (select id from auth.users where email='나의@이메일');
-- =============================================================
