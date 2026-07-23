-- One-time verification: exercises the real invite_to_team /
-- respond_to_team_invitation RPCs as the actual seeded Test Admin and Test
-- Nurse accounts (see seed.sql), the same functions the Team screen's
-- Invite/Accept buttons call. Leaves real, visible state behind (the nurse
-- actually gets added to the admin's roster) so it can also be checked in
-- the running app.
do $$
declare
  v_admin_id uuid := 'dddddddd-0000-0000-0000-000000000004'; -- Test Admin
  v_nurse_id uuid := 'dddddddd-0000-0000-0000-000000000001'; -- Test Nurse
  v_team_id uuid;
  v_invitation_id uuid;
  v_member_count int;
  v_invitation_status text;
begin
  select id into v_team_id from public.teams where admin_id = v_admin_id;
  raise notice 'STEP 1 -- team id for Test Admin: %', v_team_id;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id)::text, true);
  select public.invite_to_team(v_nurse_id, 'nurse', v_team_id) into v_invitation_id;
  raise notice 'STEP 2 -- admin sent invite, id: %', v_invitation_id;

  perform set_config('request.jwt.claims', json_build_object('sub', v_nurse_id)::text, true);
  perform public.respond_to_team_invitation(v_invitation_id, true);
  raise notice 'STEP 3 -- nurse accepted the invite';

  select count(*) into v_member_count
  from public.team_members
  where team_id = v_team_id and professional_id = v_nurse_id and role = 'nurse';

  select status into v_invitation_status from public.team_invitations where id = v_invitation_id;

  raise notice 'RESULT -- invitation status: %, nurse now on roster: %', v_invitation_status, (v_member_count = 1);
end $$;
