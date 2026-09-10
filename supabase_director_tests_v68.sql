-- 입실론 학생관리 v68
-- 운영 DB에 tests.created_by 가 없어도 원장은 전체 테스트를 본다.
-- 등수 화면의 오답 통계 RPC(test_wrong_matrix)를 복원한다.
-- Supabase SQL Editor에서 실행.

begin;

alter table tests
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create or replace function is_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and lower(btrim(role::text)) in ('director', '원장')
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
    where id = auth.uid()
      and lower(btrim(role::text)) in ('teacher', 'director', '원장', '강사')
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
      and (
        public.is_director()
        or created_by = auth.uid()
        or created_by is null
      )
  );
$$;

revoke all on function is_director() from public;
revoke all on function is_staff() from public;
revoke all on function owns_test(bigint) from public;
grant execute on function is_director() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function owns_test(bigint) to authenticated;

drop policy if exists tests_director_all on tests;
create policy tests_director_all on tests
  for all to authenticated
  using (public.is_director())
  with check (public.is_director());

drop policy if exists tests_staff_all on tests;
drop policy if exists tests_owner_read on tests;
create policy tests_owner_read on tests
  for select to authenticated
  using (
    public.is_director()
    or created_by = auth.uid()
    or (created_by is null and public.is_staff())
  );

drop policy if exists tests_owner_write on tests;
create policy tests_owner_write on tests
  for all to authenticated
  using (
    public.is_staff()
    and (
      public.is_director()
      or created_by = auth.uid()
      or created_by is null
    )
  )
  with check (
    public.is_staff()
    and (
      public.is_director()
      or created_by = auth.uid()
      or created_by is null
    )
  );

drop policy if exists tests_student_read on tests;
create policy tests_student_read on tests
  for select to authenticated
  using (
    exists (
      select 1 from test_assignments a
      where a.test_id = tests.id and a.user_id = auth.uid()
    )
  );

create or replace function list_managed_tests()
returns table(
  id bigint,
  title text,
  total int,
  exam_date date,
  closed boolean,
  created_by uuid,
  owner_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.title, t.total, t.exam_date, t.closed, t.created_by, p.name
  from tests t
  left join profiles p on p.id = t.created_by
  where public.is_staff()
    and (
      public.is_director()
      or t.created_by = auth.uid()
      or t.created_by is null
    )
  order by t.exam_date desc nulls last, t.id desc;
$$;

revoke all on function list_managed_tests() from public;
grant execute on function list_managed_tests() to authenticated;

create or replace function test_wrong_matrix(p_test_id bigint)
returns table(
  user_id uuid,
  name text,
  student_no text,
  class_name text,
  score int,
  wrong_idxs int[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t tests%rowtype;
  rec record;
  key_arr text[];
  types_arr text[];
  ans_arr text[];
  w int[];
  i int;
  k text;
  v text;
  typ text;
  ok boolean;
begin
  if not public.is_staff() then
    raise exception '권한이 없습니다';
  end if;

  select * into t from tests where id = p_test_id;
  if not found then
    raise exception '시험을 찾을 수 없습니다';
  end if;

  if not public.is_director()
     and t.created_by is not null
     and t.created_by <> auth.uid() then
    raise exception '권한이 없습니다';
  end if;

  select coalesce(array(select jsonb_array_elements_text(coalesce(t.answers, '[]'::jsonb))), '{}')
    into key_arr;
  select coalesce(array(select jsonb_array_elements_text(coalesce(t.types, '[]'::jsonb))), '{}')
    into types_arr;

  for rec in
    select s.user_id, s.score, s.answers, p.name, p.student_no, c.name as class_name
      from submissions s
      left join profiles p on p.id = s.user_id
      left join classes c on c.id = p.class_id
     where s.test_id = p_test_id
     order by s.score desc nulls last, s.user_id
  loop
    select coalesce(array(select jsonb_array_elements_text(coalesce(rec.answers, '[]'::jsonb))), '{}')
      into ans_arr;
    w := '{}';
    for i in 1 .. greatest(coalesce(t.total, 0), coalesce(array_length(key_arr, 1), 0)) loop
      k := coalesce(key_arr[i], '');
      v := btrim(coalesce(ans_arr[i], ''));
      typ := coalesce(nullif(btrim(coalesce(types_arr[i], '')), ''), 'mc');
      ok := false;
      if v <> '' then
        if typ = 'mc' then
          ok := btrim(k) = v;
        else
          ok := exists (
            select 1
              from unnest(string_to_array(k, '|')) as opt
             where btrim(opt) <> '' and btrim(opt) = v
          ) or btrim(k) = v;
        end if;
      end if;
      if not ok then
        w := array_append(w, i - 1);
      end if;
    end loop;

    user_id := rec.user_id;
    name := rec.name;
    student_no := rec.student_no;
    class_name := rec.class_name;
    score := rec.score;
    wrong_idxs := w;
    return next;
  end loop;
end;
$$;

revoke all on function test_wrong_matrix(bigint) from public;
grant execute on function test_wrong_matrix(bigint) to authenticated;

create or replace function my_wrong_history()
returns table(
  test_id bigint,
  title text,
  exam_date date,
  total int,
  wrong_idxs int[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
  key_arr text[];
  types_arr text[];
  ans_arr text[];
  w int[];
  i int;
  k text;
  v text;
  typ text;
  ok boolean;
begin
  for rec in
    select t.id, t.title, t.exam_date, t.total, t.answers, t.types, s.answers as student_answers
      from submissions s
      join tests t on t.id = s.test_id
     where s.user_id = auth.uid()
     order by t.exam_date asc nulls last, t.id asc
  loop
    select coalesce(array(select jsonb_array_elements_text(coalesce(rec.answers, '[]'::jsonb))), '{}')
      into key_arr;
    select coalesce(array(select jsonb_array_elements_text(coalesce(rec.types, '[]'::jsonb))), '{}')
      into types_arr;
    select coalesce(array(select jsonb_array_elements_text(coalesce(rec.student_answers, '[]'::jsonb))), '{}')
      into ans_arr;
    w := '{}';
    for i in 1 .. greatest(coalesce(rec.total, 0), coalesce(array_length(key_arr, 1), 0)) loop
      k := coalesce(key_arr[i], '');
      v := btrim(coalesce(ans_arr[i], ''));
      typ := coalesce(nullif(btrim(coalesce(types_arr[i], '')), ''), 'mc');
      ok := false;
      if v <> '' then
        if typ = 'mc' then
          ok := btrim(k) = v;
        else
          ok := exists (
            select 1
              from unnest(string_to_array(k, '|')) as opt
             where btrim(opt) <> '' and btrim(opt) = v
          ) or btrim(k) = v;
        end if;
      end if;
      if not ok then
        w := array_append(w, i - 1);
      end if;
    end loop;
    test_id := rec.id;
    title := rec.title;
    exam_date := rec.exam_date;
    total := rec.total;
    wrong_idxs := w;
    return next;
  end loop;
end;
$$;

revoke all on function my_wrong_history() from public;
grant execute on function my_wrong_history() to authenticated;

do $$
declare
  owner_id uuid;
begin
  select id into owner_id
    from profiles
   where lower(btrim(role::text)) in ('teacher', 'director', '원장', '강사')
     and (
       replace(coalesce(name, ''), ' ', '') ilike '%민재웅T%'
       or replace(coalesce(name, ''), ' ', '') ilike '%민재웅%'
       or replace(coalesce(nickname, ''), ' ', '') ilike '%민재웅%'
     )
   order by
     case
       when replace(coalesce(name, ''), ' ', '') ilike '%민재웅T%' then 0
       when replace(coalesce(name, ''), ' ', '') ilike '%민재웅%' then 1
       else 2
     end
   limit 1;

  if owner_id is not null then
    update tests
       set created_by = owner_id
     where created_by is null;
  end if;
end $$;

commit;
