-- 입실론 학생관리 v69
-- 원장·강사가 등수·오답분석에서 모든 응시 제출을 읽는다.
-- owns_test(created_by) 때문에 제출이 0건으로 보이면 이 스크립트를 실행한다.
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
      and lower(btrim(role::text)) in ('teacher', 'director', '원장', '강사')
  );
$$;

revoke all on function is_director() from public;
revoke all on function is_staff() from public;
grant execute on function is_director() to authenticated;
grant execute on function is_staff() to authenticated;

drop policy if exists sub_staff_read on submissions;
create policy sub_staff_read on submissions
  for select to authenticated
  using (public.is_staff());

drop policy if exists sub_staff_delete on submissions;
create policy sub_staff_delete on submissions
  for delete to authenticated
  using (public.is_staff());

create or replace function staff_test_submissions(p_test_id bigint)
returns table(
  user_id uuid,
  score int,
  correct_count int,
  answers jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception '권한이 없습니다';
  end if;

  return query
  select s.user_id, s.score, s.correct_count, s.answers
    from submissions s
   where s.test_id = p_test_id
   order by s.score desc nulls last, s.user_id;
end;
$$;

revoke all on function staff_test_submissions(bigint) from public;
grant execute on function staff_test_submissions(bigint) to authenticated;

commit;
