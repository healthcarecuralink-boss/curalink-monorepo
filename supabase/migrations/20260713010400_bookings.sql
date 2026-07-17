-- bookings: the core Booking/Visit entity. A booking made in CuraLink is the
-- exact job a professional accepts/advances/completes in CuraLink Plus.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.family_members (id) on delete set null,
  service_id uuid not null references public.services (id),
  professional_id uuid references public.profiles (id),
  address_id uuid references public.addresses (id),
  status public.booking_status not null default 'pending',
  is_express boolean not null default false,
  scheduled_at timestamptz not null default now(),
  price numeric(10, 2) not null,
  payment_status public.payment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  arrival_otp text,
  vitals jsonb not null default '{}'::jsonb,
  notes text,
  meds_given jsonb not null default '[]'::jsonb,
  lab_reports jsonb not null default '[]'::jsonb,
  handoff_note text,
  rating int check (rating between 1 and 5),
  review text,
  tip_amount numeric(10, 2) not null default 0,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create index bookings_consumer_id_idx on public.bookings (consumer_id);
create index bookings_professional_id_idx on public.bookings (professional_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_patient_id_idx on public.bookings (patient_id);
