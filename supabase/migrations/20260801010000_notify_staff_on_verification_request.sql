-- Notifies every CuraLink staff member the moment a professional applies for
-- (or adds) a role, by inserting into public.notifications -- which already
-- triggers a real push send via trigger_push_notification/send-push-notification.
-- No staff admin screen exists yet (see prior migrations' comments), so this
-- is the fastest way to actually surface a new application instead of staff
-- needing to poll professional_credentials manually.
create or replace function public.notify_staff_of_verification_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_new_roles text[];
begin
  if tg_op = 'update' then
    select array_agg(r) into v_new_roles
    from unnest(new.pending_roles) r
    where not (r = any(old.pending_roles));
  else
    v_new_roles := new.pending_roles;
  end if;

  if v_new_roles is null or array_length(v_new_roles, 1) is null then
    return new;
  end if;

  select full_name into v_full_name from public.profiles where id = new.profile_id;

  insert into public.notifications (profile_id, type, title, body, data)
  select id, 'professional_verification',
         'New verification request',
         coalesce(v_full_name, 'A professional') || ' applied for: ' || array_to_string(v_new_roles, ', '),
         jsonb_build_object('profile_id', new.profile_id, 'roles', v_new_roles)
  from public.profiles
  where is_curalink_staff = true;

  return new;
end;
$$;

create trigger notify_staff_of_verification_request
  after insert or update of pending_roles on public.professional_credentials
  for each row execute function public.notify_staff_of_verification_request();
