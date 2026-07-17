-- Appointment reminders (README extended surface, distinct from the
-- appointment calendar already built -- this is user-set reminders, not just
-- a view of existing bookings). A pg_cron job checks for due reminders every
-- minute and fans them out through the same notifications table that
-- already drives the push-notification trigger, so a fired reminder
-- automatically gets a (stubbed) push too.
create extension if not exists pg_cron;

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  booking_id uuid references public.bookings (id),
  is_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;
create index reminders_profile_id_idx on public.reminders (profile_id);
create index reminders_due_idx on public.reminders (remind_at) where not is_sent;

create policy "reminders: self only"
  on public.reminders for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create or replace function public.fire_due_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (profile_id, type, title, body, data)
  select profile_id, 'reminder', title, 'Reminder', jsonb_build_object('reminder_id', id, 'booking_id', booking_id)
  from public.reminders
  where not is_sent and remind_at <= now();

  update public.reminders
  set is_sent = true
  where not is_sent and remind_at <= now();
end;
$$;

select cron.schedule('fire-due-reminders', '* * * * *', 'select public.fire_due_reminders()');
