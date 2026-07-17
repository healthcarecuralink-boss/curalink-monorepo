-- wallets / wallet_transactions: fully private to the owning consumer.
create table public.wallets (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(10, 2) not null,
  method text,
  description text,
  reference text,
  status text not null default 'success' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions enable row level security;
create index wallet_transactions_profile_id_idx on public.wallet_transactions (profile_id);
