-- Enrollment requests for the "Coming soon" programs (home ICU setup,
-- chronic care programs, checkup packages, home nursing subscription) and
-- the Care/Care Plus/Family Plus subscription tiers -- all of these are
-- "express interest, ops follows up" flows for now, not live purchases
-- (payment gets wired in alongside Razorpay/Step 6 later). One table covers
-- all of them since they share the exact same shape: which program, which
-- patient, a note, and a status ops can move along by hand.
create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.family_members (id),
  program_key text not null check (
    program_key in ('home_icu', 'chronic_care', 'checkup_package', 'home_nursing', 'care', 'care_plus', 'family_plus')
  ),
  notes text,
  status text not null default 'requested' check (status in ('requested', 'contacted', 'active', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.program_enrollments enable row level security;
create index program_enrollments_consumer_id_idx on public.program_enrollments (consumer_id);

create policy "program_enrollments: self only"
  on public.program_enrollments for all to authenticated
  using (consumer_id = auth.uid())
  with check (consumer_id = auth.uid());

-- Column-level grant: status is excluded -- ops (not the consumer) moves a
-- request from "requested" to "contacted"/"active", same reasoning as
-- insurance_claims.status. No ops-admin role exists yet to grant it to, so
-- this is a known gap (documented), same shape as that one.
revoke update on public.program_enrollments from authenticated;
grant update (notes) on public.program_enrollments to authenticated;
