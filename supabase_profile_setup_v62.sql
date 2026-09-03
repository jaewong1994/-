-- 입실론 학생관리 v62 프로필 최초 설정 호환 패치
-- 관리자가 이름/반을 먼저 지정한 학생도 설정 화면에 갇히지 않도록
-- set_my_profile을 기존 관리자 설정을 보존하는 멱등 함수로 변경한다.

begin;

create or replace function set_my_profile(p_name text, p_class_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile profiles%rowtype;
  next_name text;
  next_class_id bigint;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select * into current_profile
  from profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception '프로필을 찾을 수 없습니다';
  end if;
  if current_profile.role::text is distinct from 'student' then
    raise exception '학생 계정만 최초 설정을 사용할 수 있습니다';
  end if;

  -- 관리자가 입력한 값은 학생의 요청으로 덮어쓰지 않는다.
  next_name := coalesce(nullif(btrim(current_profile.name), ''), nullif(btrim(p_name), ''));
  next_class_id := coalesce(current_profile.class_id, p_class_id);

  if next_name is null or char_length(next_name) > 50 then
    raise exception '이름은 1~50자로 입력하세요';
  end if;
  if next_class_id is not null
     and not exists (select 1 from classes where id = next_class_id) then
    raise exception '존재하지 않는 반입니다';
  end if;

  -- 보호 트리거에는 아직 비어 있는 반을 최초로 채울 때만 예외를 허용한다.
  perform set_config('app.profile_setup', 'on', true);

  update profiles
     set name = next_name,
         class_id = next_class_id
   where id = auth.uid();
end;
$$;

revoke all on function set_my_profile(text, bigint) from public;
grant execute on function set_my_profile(text, bigint) to authenticated;

commit;
