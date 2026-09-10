-- 입실론 학생관리 v66: 원장은 모든 테스트에 접근한다.
-- v65 실행 후 원장 목록이 비어 보이면 이 스크립트를 실행한다.
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
      and lower(btrim(role::text)) in ('teacher', 'director', '원장')
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
        created_by = auth.uid()
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and lower(btrim(p.role::text)) in ('director', '원장')
        )
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
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and lower(btrim(p.role::text)) in ('director', '원장')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and lower(btrim(p.role::text)) in ('director', '원장')
    )
  );

drop policy if exists tests_owner_read on tests;
create policy tests_owner_read on tests
  for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and lower(btrim(p.role::text)) in ('director', '원장')
    )
  );

drop policy if exists tests_owner_write on tests;
create policy tests_owner_write on tests
  for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and lower(btrim(p.role::text)) in ('teacher', 'director', '원장')
    )
    and (
      created_by = auth.uid()
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and lower(btrim(p.role::text)) in ('director', '원장')
      )
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and lower(btrim(p.role::text)) in ('teacher', 'director', '원장')
    )
    and (
      created_by = auth.uid()
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and lower(btrim(p.role::text)) in ('director', '원장')
      )
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
      t.created_by = auth.uid()
      or public.is_director()
    )
  order by t.exam_date desc nulls last, t.id desc;
$$;

revoke all on function list_managed_tests() from public;
grant execute on function list_managed_tests() to authenticated;

commit;
