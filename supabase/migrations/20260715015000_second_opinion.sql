-- Second opinion requests (README: "medical team + second opinion"). Same
-- claim-an-unassigned-row shape already used for pharmacy_orders/
-- ambulance_requests: a consumer posts a question (optionally referencing an
-- existing prescription for context), any doctor can pick it up and answer.
-- Free for now, consistent with ambulance_requests having no price column
-- either -- monetizing this is a Step-6-adjacent decision, not a schema one.
create table public.second_opinion_requests (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.family_members (id),
  prescription_id uuid references public.prescriptions (id),
  question text not null,
  doctor_id uuid references public.profiles (id),
  response text,
  status text not null default 'open' check (status in ('open', 'claimed', 'answered')),
  created_at timestamptz not null default now()
);

alter table public.second_opinion_requests enable row level security;
create index second_opinion_requests_consumer_id_idx on public.second_opinion_requests (consumer_id);
create index second_opinion_requests_doctor_id_idx on public.second_opinion_requests (doctor_id);

create policy "second_opinion_requests: consumer, claimed doctor, or open to any doctor"
  on public.second_opinion_requests for select to authenticated
  using (
    consumer_id = auth.uid()
    or doctor_id = auth.uid()
    or (status = 'open' and public.has_role('doctor'))
  );

create policy "second_opinion_requests: consumer creates"
  on public.second_opinion_requests for insert to authenticated
  with check (consumer_id = auth.uid());

create policy "second_opinion_requests: consumer updates own"
  on public.second_opinion_requests for update to authenticated
  using (consumer_id = auth.uid())
  with check (consumer_id = auth.uid());

-- A doctor claims an open request (and later answers it) the same way a
-- pharmacy partner claims an unassigned order.
create policy "second_opinion_requests: doctor claims or answers"
  on public.second_opinion_requests for update to authenticated
  using (doctor_id = auth.uid() or (doctor_id is null and status = 'open'))
  with check (doctor_id = auth.uid());
