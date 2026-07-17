-- Refer-a-friend subsystem (README: "Refer-a-friend" extended surface).
-- Every profile gets a short, unique, server-generated referral_code (never
-- client-writable -- same reasoning as roles/rating: a client-chosen code
-- could otherwise be guessed/squatted). A new signup redeems someone else's
-- code once, which pays out loyalty points to both sides.

-- referral_code is deliberately left out of the column-level update grant
-- profiles already has (see rls_policies migration) -- it's set once by the
-- trigger below and must never be client-writable.
alter table public.profiles add column referral_code text unique;

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    select exists (select 1 from public.profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code();
  end if;
  return new;
end;
$$;

create trigger set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- Backfill codes for profiles that already existed before this migration.
do $$
declare
  r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public.generate_referral_code() where id = r.id;
  end loop;
end $$;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  code_used text not null,
  status text not null default 'completed' check (status in ('pending', 'completed')),
  reward_granted boolean not null default false,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_id)
);

alter table public.referrals enable row level security;
create index referrals_referrer_id_idx on public.referrals (referrer_id);

-- Visible to either side of the referral.
create policy "referrals: referrer or referred"
  on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());

-- No client insert policy: referrals are only ever created by
-- redeem_referral_code() below (security definer), so a client can't forge
-- a referral for points without actually having signed up via a code.
create or replace function public.redeem_referral_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
begin
  select id into v_referrer_id from public.profiles where referral_code = p_code;
  if v_referrer_id is null then
    raise exception 'invalid referral code';
  end if;
  if v_referrer_id = auth.uid() then
    raise exception 'cannot refer yourself';
  end if;
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then
    raise exception 'referral already redeemed for this account';
  end if;

  insert into public.referrals (referrer_id, referred_id, code_used, reward_granted)
  values (v_referrer_id, auth.uid(), p_code, true);

  insert into public.loyalty_transactions (profile_id, points, type, reason)
  values (v_referrer_id, 50, 'earn', 'Referred a friend');
  insert into public.loyalty_transactions (profile_id, points, type, reason)
  values (auth.uid(), 50, 'earn', 'Signed up with a referral code');
end;
$$;

grant execute on function public.redeem_referral_code(text) to authenticated;
