-- Booking/ambulance-request escalation: a booking or ambulance request can sit
-- unassigned indefinitely today while the consumer still sees hopeful
-- "finding you a provider" copy -- actively misleading for a healthcare app
-- past a certain point. A pg_cron job (same pattern as fire_due_reminders)
-- checks for jobs still unassigned past a threshold, flags them with
-- escalated_at so the UI can be honest about it, and notifies every partner
-- admin so a human can manually reassign or intervene. Thresholds: 10 min for
-- express bookings, 30 min past the scheduled time for scheduled bookings
-- (an unassigned scheduled visit isn't a problem until its appointment time
-- has actually passed), 4 min for ambulance requests given the urgency.

alter table public.bookings add column escalated_at timestamptz;
alter table public.ambulance_requests add column escalated_at timestamptz;

create index bookings_pending_escalation_idx on public.bookings (scheduled_at)
  where status = 'pending' and professional_id is null and escalated_at is null;
create index ambulance_requests_pending_escalation_idx on public.ambulance_requests (created_at)
  where status = 'requested' and ambulance_partner_id is null and escalated_at is null;

-- Admins can't see unassigned jobs today (the existing SELECT policies key off
-- is_admin_of_professional(professional_id), which is null/false while
-- unassigned) -- without this, an escalated job would notify an admin who
-- then can't even open it. Scoped to the shared unassigned pool, not just
-- already-escalated ones, since that's also what the new UPDATE policy below
-- needs to let an admin manually assign into their own team before or after
-- escalation fires.
create policy "bookings: any admin sees unassigned pending jobs"
  on public.bookings for select to authenticated
  using (
    professional_id is null and status = 'pending'
    and exists (select 1 from public.teams where admin_id = auth.uid())
  );

create policy "bookings: admin assigns an unassigned job"
  on public.bookings for update to authenticated
  using (professional_id is null and status = 'pending')
  with check (is_admin_of_professional(professional_id));

create policy "ambulance_requests: any admin sees unassigned requests"
  on public.ambulance_requests for select to authenticated
  using (
    ambulance_partner_id is null and status = 'requested'
    and exists (select 1 from public.teams where admin_id = auth.uid())
  );

create policy "ambulance_requests: admin assigns an unassigned request"
  on public.ambulance_requests for update to authenticated
  using (ambulance_partner_id is null and status = 'requested')
  with check (is_admin_of_professional(ambulance_partner_id));

create or replace function public.escalate_stuck_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_ids uuid[];
begin
  select coalesce(array_agg(distinct admin_id), array[]::uuid[]) into admin_ids from public.teams;

  with newly_escalated as (
    update public.bookings
    set escalated_at = now()
    where status = 'pending'
      and professional_id is null
      and escalated_at is null
      and now() - scheduled_at >= (case when is_express then interval '10 minutes' else interval '30 minutes' end)
    returning id
  )
  insert into public.notifications (profile_id, type, title, body, data)
  select
    admin_id,
    'booking_escalation',
    'Still finding a provider',
    'A booking has gone unaccepted past the usual window. A patient may be waiting -- please review and reassign.',
    jsonb_build_object('booking_id', ne.id)
  from newly_escalated ne
  cross join unnest(admin_ids) as admin_id;

  with newly_escalated as (
    update public.ambulance_requests
    set escalated_at = now()
    where status = 'requested'
      and ambulance_partner_id is null
      and escalated_at is null
      and now() - created_at >= interval '4 minutes'
    returning id
  )
  insert into public.notifications (profile_id, type, title, body, data)
  select
    admin_id,
    'ambulance_escalation',
    'Ambulance request unaccepted',
    'An ambulance request has gone unaccepted past the urgent threshold. Please intervene immediately.',
    jsonb_build_object('ambulance_request_id', ne.id)
  from newly_escalated ne
  cross join unnest(admin_ids) as admin_id;
end;
$$;

select cron.schedule('escalate-stuck-jobs', '* * * * *', 'select public.escalate_stuck_jobs()');
