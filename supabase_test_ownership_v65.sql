-- 입실론 학생관리 v65: 테스트 소유권
-- 강사는 본인이 만든 테스트만 보고 관리한다.
-- 기존 created_by 가 비어 있는 테스트는 민재웅T 계정에 귀속한다.
-- Supabase SQL Editor에서 실행.

begin;

create or replace function is_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role::text = 'director'
  );
$$;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role::text in ('teacher','director')
  );
$$;

create or replace function owns_test(p_test_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tests
    where id = p_test_id
      and (public.is_director() or created_by = auth.uid())
  );
$$;

revoke all on function is_director() from public;
revoke all on function is_staff() from public;
revoke all on function owns_test(bigint) from public;
grant execute on function is_director() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function owns_test(bigint) to authenticated;

do $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from profiles
  where role::text in ('teacher','director')
    and (
      replace(coalesce(name,''), ' ', '') ilike '%민재웅T%'
      or replace(coalesce(name,''), ' ', '') ilike '%민재웅%'
      or replace(coalesce(nickname,''), ' ', '') ilike '%민재웅%'
    )
  order by
    case
      when replace(coalesce(name,''), ' ', '') ilike '%민재웅T%' then 0
      when replace(coalesce(name,''), ' ', '') ilike '%민재웅%' then 1
      else 2
    end,
    created_at
  limit 1;

  if owner_id is null then
    raise exception '민재웅T 계정을 찾지 못했습니다. 프로필 이름에 민재웅이 있는지 확인한 뒤 다시 실행하세요.';
  end if;

  update tests
     set created_by = owner_id
   where created_by is null;
end $$;

create or replace function tests_assign_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null or not public.is_director() then
      new.created_by := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' then
    if not public.is_director() then
      new.created_by := old.created_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tests_assign_owner_trigger on tests;
create trigger tests_assign_owner_trigger
  before insert or update on tests
  for each row execute function tests_assign_owner();

drop policy if exists tests_read on tests;
drop policy if exists tests_staff_all on tests;
drop policy if exists tests_student_read on tests;
drop policy if exists tests_owner_read on tests;
drop policy if exists tests_owner_write on tests;

create policy tests_student_read on tests
  for select to authenticated
  using (
    exists (
      select 1 from test_assignments a
      where a.test_id = tests.id and a.user_id = auth.uid()
    )
  );

create policy tests_owner_read on tests
  for select to authenticated
  using (public.is_director() or created_by = auth.uid());

create policy tests_owner_write on tests
  for all to authenticated
  using (public.is_staff() and (public.is_director() or created_by = auth.uid()))
  with check (public.is_staff() and (public.is_director() or created_by = auth.uid()));

drop policy if exists ta_staff_all on test_assignments;
create policy ta_staff_all on test_assignments
  for all to authenticated
  using (public.owns_test(test_id))
  with check (public.owns_test(test_id));

drop policy if exists sub_staff_read on submissions;
create policy sub_staff_read on submissions
  for select to authenticated
  using (public.owns_test(test_id));

drop policy if exists sub_staff_delete on submissions;
create policy sub_staff_delete on submissions
  for delete to authenticated
  using (public.owns_test(test_id));

create or replace function student_report(p_student uuid)
returns table(
  test_id bigint,
  title text,
  exam_date date,
  score int,
  correct_count int,
  total int,
  closed boolean,
  overall_rank bigint,
  overall_total bigint,
  class_rank bigint,
  class_total bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cls bigint;
begin
  if not public.is_staff() then
    raise exception '권한이 없습니다';
  end if;

  select class_id into v_cls from profiles where id = p_student;

  return query
  with mine as (
    select t.id, t.title, t.exam_date, t.total, t.closed, s.score, s.correct_count, s.user_id
    from submissions s
    join tests t on t.id = s.test_id
    where s.user_id = p_student
      and (public.is_director() or t.created_by = auth.uid())
  ),
  overall as (
    select s.test_id,
           s.user_id,
           rank() over (partition by s.test_id order by s.score desc) as o_rank,
           count(*) over (partition by s.test_id) as o_total
    from submissions s
    where s.test_id in (select id from mine)
  ),
  cls as (
    select s.test_id,
           s.user_id,
           rank() over (partition by s.test_id order by s.score desc) as c_rank,
           count(*) over (partition by s.test_id) as c_total
    from submissions s
    join profiles p on p.id = s.user_id
    where s.test_id in (select id from mine)
      and v_cls is not null
      and p.class_id = v_cls
  )
  select m.id, m.title, m.exam_date, m.score, m.correct_count, m.total, m.closed,
         o.o_rank, o.o_total, c.c_rank, c.c_total
  from mine m
  left join overall o on o.test_id = m.id and o.user_id = m.user_id
  left join cls c on c.test_id = m.id and c.user_id = m.user_id
  order by m.exam_date asc, m.id asc;
end;
$$;

create or replace function close_test(p_test_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t       tests%rowtype;
  maxpts  int;
  rec     record;
begin
  if not public.owns_test(p_test_id) then
    raise exception '본인이 만든 테스트만 마감할 수 있습니다';
  end if;

  select * into t from tests where id = p_test_id;
  if not found then raise exception '시험을 찾을 수 없습니다'; end if;

  update tests set closed = true where id = p_test_id;

  select coalesce((select sum(x::int) from jsonb_array_elements_text(t.points) as x),0)
    into maxpts;

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
end;
$$;

create or replace function teacher_regrade(p_test_id bigint, p_user_id uuid, p_answers text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t         tests%rowtype;
  i         int;
  key_arr   text[];
  pts_arr   int[];
  v_score   int := 0;
  v_correct int := 0;
begin
  if not public.owns_test(p_test_id) then
    raise exception '본인이 만든 테스트만 재채점할 수 있습니다';
  end if;
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
end;
$$;

grant execute on function student_report(uuid)               to authenticated;
grant execute on function close_test(bigint)                  to authenticated;
grant execute on function teacher_regrade(bigint,uuid,text[]) to authenticated;

commit;
