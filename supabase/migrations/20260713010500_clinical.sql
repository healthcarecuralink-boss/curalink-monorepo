-- prescriptions: written by Plus doctors, read by consumer Health Records;
-- source for pharmacy orders.
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.family_members (id),
  doctor_id uuid not null references public.profiles (id),
  booking_id uuid references public.bookings (id),
  meds jsonb not null default '[]'::jsonb,
  advice text,
  doctor_signature_url text,
  status text not null default 'active' check (status in ('active', 'completed')),
  issued_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;
create index prescriptions_patient_id_idx on public.prescriptions (patient_id);
create index prescriptions_doctor_id_idx on public.prescriptions (doctor_id);

-- lab_orders: consumer books a test, a lab uploads the report.
-- ("Lab" is not one of the six Plus roles in this system, so report upload is
-- a back-office/service-role action for now, not a client RLS-writable path.)
create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id),
  patient_id uuid references public.family_members (id),
  booking_id uuid references public.bookings (id),
  tests text[] not null,
  status text not null default 'booked' check (
    status in ('booked', 'sample_collected', 'processing', 'completed', 'cancelled')
  ),
  scheduled_at timestamptz,
  file_url text,
  price numeric(10, 2),
  created_at timestamptz not null default now()
);

alter table public.lab_orders enable row level security;
create index lab_orders_consumer_id_idx on public.lab_orders (consumer_id);
