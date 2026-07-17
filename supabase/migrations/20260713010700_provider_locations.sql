-- provider_locations: the GPS stream. One row per in-flight job, continuously
-- upserted by CuraLink Plus (en-route/transport screens) and subscribed to by
-- CuraLink's live-tracking map via Realtime. job_type distinguishes which
-- entity job_id points into, since a booking and an ambulance_request are
-- separate tables.
create table public.provider_locations (
  job_type text not null check (job_type in ('booking', 'ambulance_request')),
  job_id uuid not null,
  professional_id uuid not null references public.profiles (id),
  lat double precision not null,
  lng double precision not null,
  heading numeric,
  recorded_at timestamptz not null default now(),
  primary key (job_type, job_id)
);

alter table public.provider_locations enable row level security;
