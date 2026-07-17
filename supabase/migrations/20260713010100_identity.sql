-- profiles: one row per authenticated identity (consumer and/or professional).
-- roles = '{}' -> plain CuraLink consumer. Non-empty -> CuraLink Plus professional,
-- possibly multi-role (e.g. {nurse,admin}). Public-safe fields only; sensitive
-- professional data lives in professional_credentials (see below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  full_name text not null,
  email text,
  avatar_url text,
  roles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_roles_valid check (
    roles <@ array['nurse', 'doctor', 'vet', 'pharmacy', 'ambulance', 'admin']::text[]
  )
);

alter table public.profiles enable row level security;

-- professional_profiles: public-facing provider-card data (rating, on-duty state,
-- location for nearest-provider matching). Readable by any authenticated user.
create table public.professional_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  years_experience int,
  is_on_duty boolean not null default false,
  availability jsonb not null default '{}'::jsonb,
  rating numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  service_area text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.professional_profiles enable row level security;

-- professional_credentials: sensitive onboarding data. Only the professional
-- themselves and the admin of their team may read it.
create table public.professional_credentials (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  credentials jsonb not null default '[]'::jsonb,
  docs jsonb not null default '[]'::jsonb,
  bank_details jsonb,
  verification_status public.verification_status not null default 'pending',
  -- roles applied for but not yet approved onto profiles.roles (see
  -- request_role/approve_role in the functions migration).
  pending_roles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_credentials_pending_roles_valid check (
    pending_roles <@ array['nurse', 'doctor', 'vet', 'pharmacy', 'ambulance', 'admin']::text[]
  )
);

alter table public.professional_credentials enable row level security;
