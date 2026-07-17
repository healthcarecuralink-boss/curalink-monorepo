-- Donate / blood requests subsystem (README: "Donate/blood requests" extended
-- surface). A community bulletin: anyone can register as a donor or post a
-- request; open requests are visible to every authenticated user so donors
-- can find and respond to them, similar in spirit to professional_profiles
-- being publicly readable for provider matching.

create table public.blood_donors (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  blood_group text not null,
  city text,
  is_available boolean not null default true,
  last_donated_at date,
  updated_at timestamptz not null default now()
);

alter table public.blood_donors enable row level security;

create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  patient_name text not null,
  blood_group text not null,
  units_needed int not null default 1 check (units_needed > 0),
  hospital text,
  city text,
  urgency text not null default 'soon' check (urgency in ('urgent', 'soon', 'planned')),
  status text not null default 'open' check (status in ('open', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.blood_requests enable row level security;
create index blood_requests_requester_id_idx on public.blood_requests (requester_id);
create index blood_requests_status_idx on public.blood_requests (status);

create table public.blood_request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests (id) on delete cascade,
  donor_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, donor_id)
);

alter table public.blood_request_responses enable row level security;
create index blood_request_responses_request_id_idx on public.blood_request_responses (request_id);

-- blood_donors: a public directory (like professional_profiles), self-managed.
create policy "blood_donors: readable by any authenticated user"
  on public.blood_donors for select to authenticated
  using (true);

create policy "blood_donors: self writes"
  on public.blood_donors for insert to authenticated
  with check (profile_id = auth.uid());

create policy "blood_donors: self updates"
  on public.blood_donors for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "blood_donors: self deletes"
  on public.blood_donors for delete to authenticated
  using (profile_id = auth.uid());

-- blood_requests: open requests are a public bulletin; only the requester
-- can create/edit/cancel their own.
create policy "blood_requests: readable by any authenticated user"
  on public.blood_requests for select to authenticated
  using (true);

create policy "blood_requests: requester writes"
  on public.blood_requests for insert to authenticated
  with check (requester_id = auth.uid());

create policy "blood_requests: requester updates"
  on public.blood_requests for update to authenticated
  using (requester_id = auth.uid())
  with check (requester_id = auth.uid());

-- blood_request_responses: visible to the request's owner and the responding
-- donor; any authenticated user can respond to an open request as themselves.
create policy "blood_request_responses: requester or responding donor"
  on public.blood_request_responses for select to authenticated
  using (
    donor_id = auth.uid()
    or exists (select 1 from public.blood_requests r where r.id = request_id and r.requester_id = auth.uid())
  );

create policy "blood_request_responses: donor responds as self"
  on public.blood_request_responses for insert to authenticated
  with check (
    donor_id = auth.uid()
    and exists (select 1 from public.blood_requests r where r.id = request_id and r.status = 'open')
  );

alter publication supabase_realtime add table public.blood_requests;
alter publication supabase_realtime add table public.blood_request_responses;
