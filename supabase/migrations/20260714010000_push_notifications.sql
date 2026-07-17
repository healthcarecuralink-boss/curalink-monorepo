-- Push notification infrastructure (README: "Notifications" shared utility,
-- FCM-delivered). This migration builds everything up to the point of
-- actually calling FCM -- device token registration and per-category
-- preferences -- which is all real, working schema. The send itself is
-- stubbed in the send-push-notification Edge Function until a Firebase key
-- is available (see that function's source for the exact TODO line).

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
create index push_tokens_profile_id_idx on public.push_tokens (profile_id);

create policy "push_tokens: self only"
  on public.push_tokens for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- One row per profile, per-category toggles. README's notification types in
-- this build so far: visit/job status changes, chat messages, emergency
-- (SOS/ambulance) alerts, and promotions (loyalty/referral/care-programs).
create table public.notification_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  visit_updates boolean not null default true,
  chat_messages boolean not null default true,
  emergency_alerts boolean not null default true,
  promotions boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: self only"
  on public.notification_preferences for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Ensure a default-everything-on preferences row exists whenever a profile
-- is created, same reasoning as loyalty_accounts.
create or replace function public.ensure_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (profile_id) values (new.id) on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger ensure_notification_preferences
  after insert on public.profiles
  for each row execute function public.ensure_notification_preferences();

-- Backfill for profiles that already existed before this migration.
insert into public.notification_preferences (profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;
