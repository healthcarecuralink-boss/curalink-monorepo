-- Insurance & claims (README extended surface). A claim is tied to either a
-- completed booking or a completed pharmacy order -- the workflow itself
-- (submit, track status) needs no payment integration; only the eventual
-- payout to/from an insurer would.
create table public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider_name text not null,
  policy_number text not null,
  expiry_date date,
  created_at timestamptz not null default now()
);

alter table public.insurance_policies enable row level security;
create index insurance_policies_profile_id_idx on public.insurance_policies (profile_id);

create policy "insurance_policies: self only"
  on public.insurance_policies for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create table public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id),
  pharmacy_order_id uuid references public.pharmacy_orders (id),
  claim_amount numeric(10, 2) not null,
  description text,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
  created_at timestamptz not null default now(),
  check (booking_id is not null or pharmacy_order_id is not null)
);

alter table public.insurance_claims enable row level security;
create index insurance_claims_profile_id_idx on public.insurance_claims (profile_id);

create policy "insurance_claims: self only"
  on public.insurance_claims for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Column-level grant: status is excluded -- a claim's review outcome must not
-- be self-set by the person who filed it. No admin/reviewer role is modeled
-- yet for insurance, so status only moves via direct DB access for now
-- (documented as a known gap, same reasoning as payout_records being
-- system-generated).
revoke update on public.insurance_claims from authenticated;
grant update (description) on public.insurance_claims to authenticated;
