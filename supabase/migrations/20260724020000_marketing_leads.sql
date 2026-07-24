-- Marketing sites (curalink.co.in, curalinkplus.co.in) previously wrote their
-- "Get Early Access" / contact form submissions to a separate, orphaned
-- Supabase project (bqsstkldvojvscbutsmf) that the real product never reads
-- from -- see DEPLOY.md "Known gaps". Early-access signups therefore never
-- reached anyone doing onboarding. This brings lead capture into the same
-- project the apps use, visible to CuraLink staff via the existing
-- is_curalink_staff() helper (same one professional_credentials and the
-- verification queue already use), so leads are actually actionable.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('curalink', 'curalinkplus')),
  name text,
  email text,
  phone text,
  role text, -- service requested (curalink) or professional role applied for (curalinkplus)
  org text, -- partner/organisation name, curalinkplus only
  area text, -- neighbourhood / city text as typed on the form
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'dismissed')),
  constraint leads_has_contact_detail check (
    coalesce(name, '') <> '' or coalesce(email, '') <> '' or coalesce(phone, '') <> ''
  )
);

comment on table public.leads is 'Early-access / contact form submissions from the public marketing sites. Insert-only from anon; CuraLink staff triage from here.';

alter table public.leads enable row level security;

-- The marketing pages run unauthenticated (anon key), so anyone can submit a
-- lead -- that is the point of a public contact form. They can never read,
-- update, or delete rows back, only add new ones.
create policy "leads: anyone can submit"
  on public.leads for insert to anon, authenticated
  with check (true);

-- Triage happens in curalink-team, gated the same way the verification queue
-- already is.
create policy "leads: curalink staff view and triage"
  on public.leads for select to authenticated
  using (public.is_curalink_staff());

create policy "leads: curalink staff update status"
  on public.leads for update to authenticated
  using (public.is_curalink_staff())
  with check (public.is_curalink_staff());

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status) where status = 'new';
