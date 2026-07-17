-- Admin adds an existing registered user directly to their team by phone
-- number, skipping the request_role/approve_role application flow (README:
-- "Add team member", a distinct step from approving pending applications).
create or replace function public.admin_add_team_member(p_phone text, p_role text, p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if not public.has_role('admin') then
    raise exception 'only an admin may add team members';
  end if;

  if p_role not in ('nurse', 'doctor', 'vet', 'pharmacy', 'ambulance') then
    raise exception 'invalid role %', p_role;
  end if;

  if not exists (
    select 1 from public.teams where id = p_team_id and admin_id = auth.uid()
  ) then
    raise exception 'not your team';
  end if;

  select id into v_profile_id from public.profiles where phone = p_phone;
  if v_profile_id is null then
    raise exception 'no CuraLink Plus account found for that phone number';
  end if;

  update public.profiles
  set roles = array(select distinct unnest(roles || array[p_role]))
  where id = v_profile_id;

  update public.professional_credentials
  set pending_roles = array_remove(pending_roles, p_role),
      verification_status = 'approved'
  where profile_id = v_profile_id;

  insert into public.team_members (team_id, professional_id, role)
  values (p_team_id, v_profile_id, p_role)
  on conflict (team_id, professional_id, role) do nothing;

  return v_profile_id;
end;
$$;

grant execute on function public.admin_add_team_member(text, text, uuid) to authenticated;
