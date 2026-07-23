-- Splits "is this a legitimate, background-checked professional" (CuraLink's
-- own call, made once, globally) from "is this person on *my* roster" (each
-- Partner Admin's own call -- a professional can be on many rosters at once,
-- which team_members already supported via unique(team_id, professional_id,
-- role) rather than a per-professional constraint). Previously approve_role()
-- conflated both: whichever admin clicked first was silently also acting as
-- CuraLink's verification authority, and the flow ran backwards from how
-- staffing agencies actually work -- self-apply + any-admin-approves, instead
-- of agency-invites-a-known-good-professional + professional-accepts.
-- Verification review now happens in the separate curalink-team app, gated
-- by profiles.is_curalink_staff.

-- ---------------------------------------------------------------- profiles
alter table public.profiles add column is_curalink_staff boolean not null default false;

create or replace function public.is_curalink_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_curalink_staff from public.profiles where id = auth.uid()), false);
$$;

-- Replaces "profiles: admin views pending applicants" -- pending-applicant
-- visibility is CuraLink staff's job now, not any partner admin's.
drop policy "profiles: admin views pending applicants" on public.profiles;

create policy "profiles: curalink staff views pending applicants"
  on public.profiles for select to authenticated
  using (
    public.is_curalink_staff()
    and exists (
      select 1 from public.professional_credentials pc
      where pc.profile_id = profiles.id and array_length(pc.pending_roles, 1) is not null
    )
  );

-- ------------------------------------------------ professional_credentials
-- Partners no longer see raw submitted documents -- only CuraLink staff (for
-- review) or the professional themself. Once invite_to_team accepts someone
-- as a candidate they are already CuraLink-verified by construction, so a
-- partner never needed direct credentials visibility in the first place.
drop policy "professional_credentials: self or admin of team" on public.professional_credentials;
drop policy "professional_credentials: admin views pending applications" on public.professional_credentials;

create policy "professional_credentials: self or curalink staff"
  on public.professional_credentials for select to authenticated
  using (profile_id = auth.uid() or public.is_curalink_staff());

-- ------------------------------------------------------------ team_invitations
-- Partner-initiated: an admin invites an already-verified professional onto
-- their roster; the professional accepts or rejects. Replaces both the old
-- self-apply-then-any-admin-approves flow and the zero-consent
-- admin_add_team_member() shortcut below.
create type public.team_invitation_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('nurse', 'doctor', 'vet', 'pharmacy', 'ambulance')),
  status public.team_invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.team_invitations enable row level security;
create index team_invitations_team_id_idx on public.team_invitations (team_id);
create index team_invitations_professional_id_idx on public.team_invitations (professional_id);

-- Only one pending invite per (team, professional, role) at a time -- a
-- rejected/cancelled invite can be re-sent later, so this is a partial index
-- rather than a plain unique constraint.
create unique index team_invitations_one_pending_idx
  on public.team_invitations (team_id, professional_id, role)
  where (status = 'pending');

create policy "team_invitations: team admin or invited professional"
  on public.team_invitations for select to authenticated
  using (
    professional_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid())
  );

-- An invited professional needs the inviting agency's name to show on their
-- invitations screen -- "teams: admin only" (rls_policies migration) doesn't
-- cover this, since they aren't the team's admin.
create policy "teams: invited professional views team name"
  on public.teams for select to authenticated
  using (
    exists (
      select 1 from public.team_invitations ti
      where ti.team_id = teams.id and ti.professional_id = auth.uid()
    )
  );

-- No direct insert/update policies -- all writes go through the
-- security-definer RPCs below, which enforce their own authorization
-- (mirrors approve_role/admin_review_time_off elsewhere in this schema).

create or replace function public.invite_to_team(p_professional_id uuid, p_role text, p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation_id uuid;
begin
  if p_role not in ('nurse', 'doctor', 'vet', 'pharmacy', 'ambulance') then
    raise exception 'invalid role %', p_role;
  end if;

  if not exists (
    select 1 from public.teams where id = p_team_id and admin_id = auth.uid()
  ) then
    raise exception 'not your team';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_professional_id and p_role = any(roles)
  ) then
    raise exception 'professional is not yet CuraLink-verified for that role';
  end if;

  insert into public.team_invitations (team_id, professional_id, role)
  values (p_team_id, p_professional_id, p_role)
  returning id into v_invitation_id;

  return v_invitation_id;
end;
$$;

grant execute on function public.invite_to_team(uuid, text, uuid) to authenticated;

create or replace function public.cancel_team_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.team_invitations ti
  set status = 'cancelled'
  where ti.id = p_invitation_id
    and ti.status = 'pending'
    and exists (select 1 from public.teams t where t.id = ti.team_id and t.admin_id = auth.uid());

  if not found then
    raise exception 'invitation not found or not yours to cancel';
  end if;
end;
$$;

grant execute on function public.cancel_team_invitation(uuid) to authenticated;

create or replace function public.respond_to_team_invitation(p_invitation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.team_invitations;
begin
  select * into v_invitation
  from public.team_invitations
  where id = p_invitation_id and professional_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'invitation not found or already responded to';
  end if;

  if p_accept then
    update public.team_invitations set status = 'accepted', responded_at = now() where id = p_invitation_id;
    insert into public.team_members (team_id, professional_id, role)
    values (v_invitation.team_id, v_invitation.professional_id, v_invitation.role)
    on conflict (team_id, professional_id, role) do nothing;
  else
    update public.team_invitations set status = 'rejected', responded_at = now() where id = p_invitation_id;
  end if;
end;
$$;

grant execute on function public.respond_to_team_invitation(uuid, boolean) to authenticated;

-- Lets an admin find already-verified professionals to invite. Table-level
-- SELECT on profiles already exposes any professional-card row to any
-- authenticated user (see "profiles: self or any professional card is
-- readable" in rls_policies) -- this just adds admin-only length/result
-- limits and a role filter behind one typed call instead of a raw client
-- query.
create or replace function public.search_verified_professionals(p_query text, p_role text default null)
returns table (id uuid, full_name text, phone text, roles text[])
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.phone, p.roles
  from public.profiles p
  where public.has_role('admin')
    and length(p_query) >= 3
    and (p_role is null or p_role = any(p.roles))
    and (p.full_name ilike '%' || p_query || '%' or p.phone = p_query)
  limit 20;
$$;

grant execute on function public.search_verified_professionals(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- approve_role / reject_role: now CuraLink staff's call, not any partner
-- admin's, and no longer seat the professional on a team -- team membership
-- is the separate invite_to_team / respond_to_team_invitation step above.
drop function if exists public.approve_role(uuid, text, uuid);

create or replace function public.approve_role(p_professional_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_curalink_staff() then
    raise exception 'only CuraLink staff may approve roles';
  end if;

  update public.profiles
  set roles = array(select distinct unnest(roles || array[p_role]))
  where id = p_professional_id;

  update public.professional_credentials
  set pending_roles = array_remove(pending_roles, p_role),
      verification_status = 'approved'
  where profile_id = p_professional_id;
end;
$$;

grant execute on function public.approve_role(uuid, text) to authenticated;

create or replace function public.reject_role(p_professional_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_curalink_staff() then
    raise exception 'only CuraLink staff may reject role applications';
  end if;

  update public.professional_credentials
  set pending_roles = array_remove(pending_roles, p_role),
      verification_status = 'rejected'
  where profile_id = p_professional_id;
end;
$$;

grant execute on function public.reject_role(uuid, text) to authenticated;

-- Superseded by invite_to_team/respond_to_team_invitation -- the old
-- zero-consent "add by phone number" path let an admin grant a role and seat
-- someone on their roster in one transaction, with no CuraLink verification
-- and no professional consent.
drop function if exists public.admin_add_team_member(text, text, uuid);
