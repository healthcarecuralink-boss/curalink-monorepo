-- Fixes infinite recursion (Postgres 42P17): "teams: invited professional
-- views team name" queried team_invitations directly, and
-- "team_invitations: team admin or invited professional" queries teams
-- directly right back -- a mutual cross-table RLS reference, the exact
-- pitfall is_admin_of_professional()/team_admin_of() (functions_and_triggers
-- migration, admin_and_chat_helpers migration) were built to avoid elsewhere
-- in this schema. Route through a security-definer helper instead, same
-- pattern as those.
create or replace function public.is_invited_to_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_invitations ti
    where ti.team_id = p_team_id and ti.professional_id = auth.uid()
  );
$$;

grant execute on function public.is_invited_to_team(uuid) to authenticated;

drop policy "teams: invited professional views team name" on public.teams;

create policy "teams: invited professional views team name"
  on public.teams for select to authenticated
  using (public.is_invited_to_team(id));
