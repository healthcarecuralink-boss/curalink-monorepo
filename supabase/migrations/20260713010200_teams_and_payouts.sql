-- teams / team_members: a Partner Admin's roster (README: "Team roster").
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('nurse', 'doctor', 'vet', 'pharmacy', 'ambulance')),
  status public.team_member_status not null default 'active',
  docs_ok boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (team_id, professional_id, role)
);

alter table public.team_members enable row level security;

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_professional_id_idx on public.team_members (professional_id);

-- payout_methods: bank/UPI details a professional links. Self-access only.
create table public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  method public.payout_method_type not null,
  details jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payout_methods enable row level security;
create index payout_methods_professional_id_idx on public.payout_methods (professional_id);

-- payout_records: system-generated payout ledger. Professional sees own,
-- admin sees aggregate for their team (README: "Plus professional + admin aggregate").
create table public.payout_records (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  payout_method_id uuid references public.payout_methods (id),
  amount numeric(10, 2) not null,
  status public.payout_status not null default 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payout_records enable row level security;
create index payout_records_professional_id_idx on public.payout_records (professional_id);
