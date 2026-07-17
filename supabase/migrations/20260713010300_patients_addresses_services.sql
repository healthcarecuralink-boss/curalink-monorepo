-- family_members: who a CuraLink consumer books care for ("who are you caring for?").
-- Includes the account holder's own "self" row and pets.
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  relation text not null,
  date_of_birth date,
  gender text,
  species text,
  blood_group text,
  allergies text[] not null default '{}',
  conditions text[] not null default '{}',
  photo_url text,
  is_self boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;
create index family_members_owner_id_idx on public.family_members (owner_id);

-- addresses: consumer-saved locations, used for booking + pickup addresses.
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  neighborhood text,
  city text not null default 'Hyderabad',
  state text not null default 'Telangana',
  pincode text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;
create index addresses_owner_id_idx on public.addresses (owner_id);

-- services: bookable catalog (nurse visit, doctor teleconsult, physio, vet, lab, ...).
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'nurse', 'doctor', 'physio', 'vet', 'pediatric', 'lab', 'elder', 'ambulance', 'pharmacy'
    )
  ),
  name text not null,
  description text,
  price_from numeric(10, 2) not null,
  duration_mins int,
  is_express_eligible boolean not null default false,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
