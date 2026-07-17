-- Step 10 (multi-role accounts, team chat, admin dashboard) needs a few
-- pieces the original Step 2 schema didn't cover, because "an admin approves
-- a brand-new applicant" only becomes RLS-visible *after* team_members
-- already links them -- which is exactly what approval is supposed to create.
-- See verification-pending.tsx's comment: "this happens once an admin
-- approves via the dashboard built in Step 10."

-- A pending applicant has no team yet, so is_admin_of_professional() (which
-- joins through team_members) can't see them. Any admin needs visibility
-- into *unaffiliated* pending applications so there's something to approve.
create policy "profiles: admin views pending applicants"
  on public.profiles for select to authenticated
  using (
    public.has_role('admin')
    and exists (
      select 1 from public.professional_credentials pc
      where pc.profile_id = profiles.id and array_length(pc.pending_roles, 1) is not null
    )
  );

create policy "professional_credentials: admin views pending applications"
  on public.professional_credentials for select to authenticated
  using (public.has_role('admin') and array_length(pending_roles, 1) is not null);

-- Reject side of the request_role/approve_role pair -- verification_status
-- and pending_roles are deliberately not client-writable (see rls_policies),
-- so rejecting an application needs the same security-definer treatment as
-- approve_role.
create or replace function public.reject_role(p_professional_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'only an admin may reject role applications';
  end if;

  update public.professional_credentials
  set pending_roles = array_remove(pending_roles, p_role),
      verification_status = 'rejected'
  where profile_id = p_professional_id;
end;
$$;

grant execute on function public.reject_role(uuid, text) to authenticated;

-- Admin reassigns a job between members of their own team (README: "Reassign
-- job"). The existing update policy only covers the consumer or the
-- currently-assigned professional; an admin acting on their team's booking
-- was never granted a path. `with check` re-evaluates is_admin_of_professional
-- against the *new* professional_id, so an admin can only reassign to someone
-- already on their own team.
create policy "bookings: admin reassigns within their team"
  on public.bookings for update to authenticated
  using (public.is_admin_of_professional(professional_id))
  with check (public.is_admin_of_professional(professional_id));

-- Lets a professional discover their own team's admin (e.g. to auto-add them
-- to a per-booking care-team chat channel) without a broad "teams: readable
-- by members" policy that would expose the whole teams table shape.
create or replace function public.team_admin_of(p_professional_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.admin_id
  from public.team_members tm
  join public.teams t on t.id = tm.team_id
  where tm.professional_id = p_professional_id
  limit 1;
$$;

grant execute on function public.team_admin_of(uuid) to authenticated;
