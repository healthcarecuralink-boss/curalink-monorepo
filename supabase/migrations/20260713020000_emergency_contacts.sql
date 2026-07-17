-- emergency_contacts: README lists this as its own CuraLink screen
-- ("Profile home -> Add/edit family member -> Medical records -> Emergency
-- contacts") distinct from family_members (who you book care for, vs. who
-- to call in an emergency -- overlapping people in practice, but a
-- deliberately separate list since a contact doesn't need to be a
-- bookable patient).
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  relation text not null,
  phone text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;
create index emergency_contacts_owner_id_idx on public.emergency_contacts (owner_id);

create policy "emergency_contacts: owner only"
  on public.emergency_contacts for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
