-- 입실론 학생관리 v67: 테스트 상담 리포트를 정시상담 이전처럼 복원
-- 강사·원장이 학생의 모든 응시 점수·등수·메달을 본다. created_by 필터를 제거한다.
-- 테스트 관리 화면의 소유권(강사는 본인 생성분만 관리)은 그대로 둔다.
-- Supabase SQL Editor에서 실행.

begin;

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

revoke all on function student_report(uuid) from public;
grant execute on function student_report(uuid) to authenticated;

commit;
