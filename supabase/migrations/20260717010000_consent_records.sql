-- Timestamped, immutable record that a user actually accepted the Terms of
-- Service + Privacy Policy at signup -- DPDP Act 2023 requires consent to be
-- verifiable, not just a UI checkbox with no server-side trace. `version`
-- lets a future policy change be distinguished from what a given user
-- actually agreed to (bump CONSENT_VERSION in both apps' terms screens and
-- this becomes a real per-version audit trail, not just a single flag).
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null default 'terms_and_privacy',
  version text not null,
  accepted_at timestamptz not null default now()
);

alter table public.consent_records enable row level security;
create index consent_records_profile_id_idx on public.consent_records (profile_id);

create policy "consent_records: self reads own"
  on public.consent_records for select to authenticated
  using (profile_id = auth.uid());

create policy "consent_records: self creates own"
  on public.consent_records for insert to authenticated
  with check (profile_id = auth.uid());

-- No update/delete policy: a consent record is a permanent audit entry, not
-- something the client (or even the user) should be able to alter or erase
-- after the fact.
