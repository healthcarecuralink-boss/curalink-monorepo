-- Loyalty rewards subsystem (README: "Loyalty rewards" extended surface).
-- Mirrors the wallets/wallet_transactions pattern from Step 2: a derived
-- balance that only ever moves via inserting ledger rows, never a direct
-- client write to the balance itself.

create table public.loyalty_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.loyalty_accounts enable row level security;

create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  points int not null,
  type text not null check (type in ('earn', 'redeem')),
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.loyalty_transactions enable row level security;
create index loyalty_transactions_profile_id_idx on public.loyalty_transactions (profile_id);

create table public.reward_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost int not null check (points_cost > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reward_catalog enable row level security;

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid not null references public.reward_catalog (id),
  points_spent int not null,
  status text not null default 'pending' check (status in ('pending', 'fulfilled')),
  created_at timestamptz not null default now()
);

alter table public.reward_redemptions enable row level security;
create index reward_redemptions_profile_id_idx on public.reward_redemptions (profile_id);

-- RLS: everyone manages their own loyalty data; the ledger and redemptions
-- are insert-only via the functions below (no direct client insert policy),
-- same reasoning as wallet_transactions.
create policy "loyalty_accounts: self only"
  on public.loyalty_accounts for select to authenticated
  using (profile_id = auth.uid());

create policy "loyalty_transactions: self only"
  on public.loyalty_transactions for select to authenticated
  using (profile_id = auth.uid());

create policy "reward_catalog: readable by any authenticated user"
  on public.reward_catalog for select to authenticated
  using (true);

create policy "reward_redemptions: self only"
  on public.reward_redemptions for select to authenticated
  using (profile_id = auth.uid());

-- Ensure a zero-balance account exists whenever a profile is created, so
-- reads never have to special-case "no row yet".
create or replace function public.ensure_loyalty_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.loyalty_accounts (profile_id) values (new.id) on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger ensure_loyalty_account
  after insert on public.profiles
  for each row execute function public.ensure_loyalty_account();

-- Applying a ledger row is the only path that can move a balance.
create or replace function public.apply_loyalty_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.loyalty_accounts (profile_id, balance)
  values (new.profile_id, case when new.type = 'earn' then new.points else -new.points end)
  on conflict (profile_id) do update
    set balance = public.loyalty_accounts.balance + (case when new.type = 'earn' then new.points else -new.points end),
        updated_at = now();
  return new;
end;
$$;

create trigger apply_loyalty_transaction
  after insert on public.loyalty_transactions
  for each row execute function public.apply_loyalty_transaction();

-- Earn points automatically when a booking or pharmacy order completes.
create or replace function public.award_loyalty_for_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into public.loyalty_transactions (profile_id, points, type, reason)
    values (new.consumer_id, 10, 'earn', 'Completed visit');
  end if;
  return new;
end;
$$;

create trigger award_loyalty_for_booking
  after update of status on public.bookings
  for each row execute function public.award_loyalty_for_booking();

create or replace function public.award_loyalty_for_pharmacy_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into public.loyalty_transactions (profile_id, points, type, reason)
    values (new.consumer_id, 5, 'earn', 'Completed pharmacy order');
  end if;
  return new;
end;
$$;

create trigger award_loyalty_for_pharmacy_order
  after update of status on public.pharmacy_orders
  for each row execute function public.award_loyalty_for_pharmacy_order();

-- Redeeming spends points atomically: checks balance, records the spend,
-- and creates the redemption row -- never a direct client insert into
-- loyalty_transactions (which would let a user "earn" points for free).
create or replace function public.redeem_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost int;
  v_balance int;
  v_redemption_id uuid;
begin
  select points_cost into v_cost from public.reward_catalog where id = p_reward_id and is_active = true;
  if v_cost is null then
    raise exception 'reward not found or inactive';
  end if;

  select balance into v_balance from public.loyalty_accounts where profile_id = auth.uid();
  if coalesce(v_balance, 0) < v_cost then
    raise exception 'not enough points';
  end if;

  insert into public.loyalty_transactions (profile_id, points, type, reason)
  values (auth.uid(), v_cost, 'redeem', 'Redeemed reward');

  insert into public.reward_redemptions (profile_id, reward_id, points_spent)
  values (auth.uid(), p_reward_id, v_cost)
  returning id into v_redemption_id;

  return v_redemption_id;
end;
$$;

grant execute on function public.redeem_reward(uuid) to authenticated;

alter publication supabase_realtime add table public.loyalty_transactions;

-- Backfill accounts for profiles that already existed before this migration
-- (the trigger above only covers new inserts going forward).
insert into public.loyalty_accounts (profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;

insert into public.reward_catalog (name, description, points_cost) values
  ('₹50 off your next visit', 'Applied automatically at checkout', 50),
  ('Free lab test (Blood Sugar)', 'One free fasting blood sugar test', 80),
  ('₹150 off your next visit', 'Applied automatically at checkout', 150),
  ('Free home nursing consultation', '30-minute consultation with a home nurse', 200);
