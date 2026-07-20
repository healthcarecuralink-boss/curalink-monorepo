-- Weekly schedule editing already exists via professional_profiles.availability
-- (set once during onboarding in availability-setup.tsx, which promises "you
-- can change this anytime from Schedule" -- that screen never existed). This
-- adds the other half: time-off requests, reviewed by the professional's team
-- admin (an approver role that already exists, unlike insurance claims/
-- program enrollments where no reviewer was modeled).
create type public.time_off_status as enum ('requested', 'approved', 'rejected');

create table public.professional_time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status public.time_off_status not null default 'requested',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.professional_time_off enable row level security;
create index professional_time_off_professional_id_idx on public.professional_time_off (professional_id);

create policy "professional_time_off: self or team admin"
  on public.professional_time_off for select to authenticated
  using (professional_id = auth.uid() or public.is_admin_of_professional(professional_id));

create policy "professional_time_off: self creates own request"
  on public.professional_time_off for insert to authenticated
  with check (professional_id = auth.uid());

create policy "professional_time_off: self cancels own pending request"
  on public.professional_time_off for delete to authenticated
  using (professional_id = auth.uid() and status = 'requested');

-- status is deliberately excluded from the client update grant below -- only
-- the admin_review_time_off() function (security definer, checks
-- is_admin_of_professional internally) may move it out of "requested".
revoke update on public.professional_time_off from authenticated;
grant update (start_date, end_date, reason) on public.professional_time_off to authenticated;

create or replace function public.admin_review_time_off(p_time_off_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professional_id uuid;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid status %', p_status;
  end if;

  select professional_id into v_professional_id from public.professional_time_off where id = p_time_off_id;
  if v_professional_id is null then
    raise exception 'time off request not found';
  end if;

  if not public.is_admin_of_professional(v_professional_id) then
    raise exception 'only the professional''s team admin may review this request';
  end if;

  update public.professional_time_off set status = p_status::time_off_status where id = p_time_off_id;
end;
$$;

grant execute on function public.admin_review_time_off(uuid, text) to authenticated;
