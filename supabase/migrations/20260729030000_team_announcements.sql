-- Team broadcast: an admin can send a real message to their whole team
-- roster, fanning out as a real push notification to each active member
-- (reuses the existing notifications -> FCM trigger pipeline, same one
-- reminders and escalation alerts already use).
--
-- No direct insert policy on team_announcements -- both the announcement
-- row and the notification fan-out only happen through
-- send_team_announcement, which verifies the caller is really that team's
-- admin first. Mirrors approve_role's shape (security definer, explicit
-- admin check) rather than trusting a client-supplied admin_id.

create table public.team_announcements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.team_announcements enable row level security;
create index team_announcements_team_id_idx on public.team_announcements (team_id, created_at desc);

create policy "team_announcements: team members and admin read"
  on public.team_announcements for select to authenticated
  using (
    admin_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_announcements.team_id and tm.professional_id = auth.uid()
    )
  );

revoke insert on public.team_announcements from authenticated;

create or replace function public.send_team_announcement(p_team_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.teams where id = p_team_id and admin_id = auth.uid()) then
    raise exception 'only the team admin may send an announcement';
  end if;

  insert into public.team_announcements (team_id, admin_id, message)
  values (p_team_id, auth.uid(), p_message);

  insert into public.notifications (profile_id, type, title, body, data)
  select tm.professional_id, 'team_announcement', 'Message from your team admin', p_message, jsonb_build_object('team_id', p_team_id)
  from public.team_members tm
  where tm.team_id = p_team_id and tm.status = 'active';
end;
$$;

grant execute on function public.send_team_announcement(uuid, text) to authenticated;
