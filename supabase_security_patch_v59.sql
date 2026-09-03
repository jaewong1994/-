-- 입실론 학생관리 v59 보안 패치
-- 적용 대상: 기존 supabase_schema.sql 적용 DB
-- Supabase SQL Editor에서 실행. 실행 전 개발 프로젝트에서 먼저 검증하세요.

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
    where id = auth.uid() and role = 'director'
  );
$$;

-- 학생의 role/class_id/teacher_id 변경과 교사의 role 변경을 DB에서 차단한다.
-- service_role 작업(auth.uid() is null)은 계정 관리 Edge Function을 위해 허용한다.
create or replace function protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.uid() is null then
    return new;
  end if;

  select role into actor_role from profiles where id = auth.uid();

  if actor_role = 'director' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception '역할 변경은 원장만 할 수 있습니다';
  end if;

  if actor_role = 'student' then
    if (new.class_id is distinct from old.class_id
        and coalesce(current_setting('app.profile_setup', true), '') <> 'on')
       or new.teacher_id is distinct from old.teacher_id
       or new.student_no is distinct from old.student_no
       or new.initial_password is distinct from old.initial_password then
      raise exception '보호된 프로필 항목은 변경할 수 없습니다';
    end if;
  elsif actor_role = 'teacher' then
    if new.initial_password is distinct from old.initial_password then
      raise exception '초기 비밀번호는 원장만 변경할 수 있습니다';
    end if;
  else
    raise exception '프로필 변경 권한이 없습니다';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields_trigger on profiles;
create trigger protect_profile_sensitive_fields_trigger
  before update on profiles
  for each row execute function protect_profile_sensitive_fields();

-- 최초 설정 RPC를 실제 1회성으로 제한하고 임의 반 변경을 막는다.
create or replace function set_my_profile(p_name text, p_class_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile profiles%rowtype;
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
  if current_profile.role is distinct from 'student' then
    raise exception '학생 계정만 최초 설정을 사용할 수 있습니다';
  end if;
  if nullif(btrim(current_profile.name), '') is not null then
    raise exception '최초 설정이 이미 완료되었습니다';
  end if;
  if nullif(btrim(p_name), '') is null or char_length(btrim(p_name)) > 50 then
    raise exception '이름은 1~50자로 입력하세요';
  end if;
  if p_class_id is not null and not exists (select 1 from classes where id = p_class_id) then
    raise exception '존재하지 않는 반입니다';
  end if;
  if current_profile.class_id is not null
     and p_class_id is distinct from current_profile.class_id then
    raise exception '배정된 반은 변경할 수 없습니다';
  end if;

  -- 이 트랜잭션 안의 검증된 최초 설정에서만 class_id 변경을 허용한다.
  perform set_config('app.profile_setup', 'on', true);

  update profiles
     set name = btrim(p_name),
         class_id = coalesce(current_profile.class_id, p_class_id)
   where id = auth.uid();
end;
$$;

revoke all on function is_director() from public;
revoke all on function protect_profile_sensitive_fields() from public;
revoke all on function set_my_profile(text, bigint) from public;
grant execute on function is_director() to authenticated;
grant execute on function set_my_profile(text, bigint) to authenticated;

commit;
