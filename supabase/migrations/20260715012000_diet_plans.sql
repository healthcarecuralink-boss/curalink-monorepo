-- Diet & nutrition plan (README extended surface). Prescribed by whichever
-- professional treated the patient (mirrors prescriptions' shape: written by
-- Plus, read by the consumer), rather than a generic content library --
-- reuses is_assigned_provider_for_patient() from the Step 2 functions
-- migration, the same helper that already gates a nurse creating a pharmacy
-- order for a patient they're visiting.
create table public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.family_members (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  title text not null,
  meals jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.diet_plans enable row level security;
create index diet_plans_patient_id_idx on public.diet_plans (patient_id);

create policy "diet_plans: patient owner or creating professional"
  on public.diet_plans for select to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.family_members f where f.id = patient_id and f.owner_id = auth.uid())
  );

create policy "diet_plans: assigned provider creates"
  on public.diet_plans for insert to authenticated
  with check (created_by = auth.uid() and public.is_assigned_provider_for_patient(patient_id));

create policy "diet_plans: creator updates"
  on public.diet_plans for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
