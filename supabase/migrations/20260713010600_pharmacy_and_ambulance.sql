-- pharmacy_orders: consumer or nurse creates, pharmacy partner fulfills.
create table public.pharmacy_orders (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id),
  patient_id uuid references public.family_members (id),
  prescription_id uuid references public.prescriptions (id),
  pharmacy_id uuid references public.profiles (id),
  delivery_address_id uuid references public.addresses (id),
  items jsonb not null default '[]'::jsonb,
  status public.pharmacy_order_status not null default 'placed',
  pickup_code text,
  total_price numeric(10, 2),
  rating int check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pharmacy_orders enable row level security;
create index pharmacy_orders_consumer_id_idx on public.pharmacy_orders (consumer_id);
create index pharmacy_orders_pharmacy_id_idx on public.pharmacy_orders (pharmacy_id);

-- ambulance_requests: consumer or Plus (SOS) creates, ambulance partner accepts.
create table public.ambulance_requests (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id),
  patient_init text,
  type public.ambulance_type not null,
  reason text,
  pickup_address_id uuid references public.addresses (id),
  hospital text,
  ambulance_partner_id uuid references public.profiles (id),
  status public.ambulance_status not null default 'requested',
  rating int check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ambulance_requests enable row level security;
create index ambulance_requests_consumer_id_idx on public.ambulance_requests (consumer_id);
create index ambulance_requests_partner_id_idx on public.ambulance_requests (ambulance_partner_id);
