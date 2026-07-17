-- Helper functions used by RLS policies. security definer + fixed search_path
-- so they can read tables the calling role may not have direct grants on,
-- without being vulnerable to search_path hijacking.

create or replace function public.current_roles()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select roles from public.profiles where id = auth.uid()), '{}'::text[]);
$$;

create or replace function public.has_role(r text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select r = any(public.current_roles());
$$;

-- True if the calling user is the admin of a team that professional_id belongs to.
create or replace function public.is_admin_of_professional(prof_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.professional_id = prof_id
      and t.admin_id = auth.uid()
  );
$$;

-- True if the calling user may view the GPS stream for a given (job_type, job_id):
-- the job's consumer, or the assigned professional.
create or replace function public.can_view_job_location(p_job_type text, p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_job_type
    when 'booking' then exists (
      select 1 from public.bookings b
      where b.id = p_job_id
        and (b.consumer_id = auth.uid() or b.professional_id = auth.uid())
    )
    when 'ambulance_request' then exists (
      select 1 from public.ambulance_requests a
      where a.id = p_job_id
        and (a.consumer_id = auth.uid() or a.ambulance_partner_id = auth.uid())
    )
    else false
  end;
$$;

-- True if the calling user is a professional with a booking connecting them to
-- the given patient (used to let an assigned nurse create a pharmacy order for
-- the patient they're currently visiting).
create or replace function public.is_assigned_provider_for_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings b
    where b.patient_id = p_patient_id
      and b.professional_id = auth.uid()
  );
$$;

-- Generic updated_at maintenance trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.professional_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.professional_credentials
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pharmacy_orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ambulance_requests
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

-- Auto-create profile + wallet rows when a new auth.users row appears
-- (phone OTP sign-up). roles always starts empty -- it is never taken from
-- client-supplied signup metadata, since that would let anyone self-elevate
-- to a professional/admin role. Use request_role/approve_role below instead.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, email)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'),
    new.email
  );

  insert into public.wallets (profile_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ensure professional_profiles + professional_credentials rows exist whenever
-- a profile gains its first (or an additional) role -- this is what makes
-- CuraLink Plus's "+ Add role" instant, with no re-onboarding.
create or replace function public.ensure_professional_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if array_length(new.roles, 1) is not null then
    insert into public.professional_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;

    insert into public.professional_credentials (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger ensure_professional_rows
  after insert or update of roles on public.profiles
  for each row execute function public.ensure_professional_rows();

-- ---------------------------------------------------------------------------
-- Role grants. profiles.roles is deliberately NOT in the authenticated user's
-- UPDATE grant (see rls_policies migration) -- the only ways to change it are
-- these two functions, which run as the function owner (bypassing RLS) but
-- enforce their own authorization checks in-line.

-- A signed-in user applies for a professional role (e.g. "nurse"). This does
-- NOT grant the role -- it just records interest for an admin to review,
-- matching the onboarding flow's "Verification pending" step.
create or replace function public.request_role(p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('nurse', 'doctor', 'vet', 'pharmacy', 'ambulance', 'admin') then
    raise exception 'invalid role %', p_role;
  end if;

  insert into public.professional_credentials as pc (profile_id, pending_roles)
  values (auth.uid(), array[p_role])
  on conflict (profile_id) do update
    set pending_roles = (
      select array(select distinct unnest(pc.pending_roles || excluded.pending_roles))
    );
end;
$$;

grant execute on function public.request_role(text) to authenticated;

-- A Partner Admin approves a pending role application: grants the role on
-- profiles.roles, clears it from pending_roles, and seats the professional on
-- the admin's team roster. Restricted to callers who are themselves an admin
-- of the target team.
create or replace function public.approve_role(p_professional_id uuid, p_role text, p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'only an admin may approve roles';
  end if;

  if not exists (
    select 1 from public.teams where id = p_team_id and admin_id = auth.uid()
  ) then
    raise exception 'not your team';
  end if;

  update public.profiles
  set roles = array(select distinct unnest(roles || array[p_role]))
  where id = p_professional_id;

  update public.professional_credentials
  set pending_roles = array_remove(pending_roles, p_role),
      verification_status = 'approved'
  where profile_id = p_professional_id;

  insert into public.team_members (team_id, professional_id, role)
  values (p_team_id, p_professional_id, p_role)
  on conflict (team_id, professional_id, role) do nothing;
end;
$$;

grant execute on function public.approve_role(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Server-generated OTPs (README: "generate real OTPs server-side" -- pickup
-- codes and arrival codes must never be client-writable).
create or replace function public.generate_otp()
returns text
language sql
as $$
  select lpad((floor(random() * 1000000))::text, 6, '0');
$$;

create or replace function public.set_booking_arrival_otp()
returns trigger
language plpgsql
as $$
begin
  new.arrival_otp = public.generate_otp();
  return new;
end;
$$;

create trigger set_booking_arrival_otp
  before insert on public.bookings
  for each row execute function public.set_booking_arrival_otp();

create or replace function public.set_pharmacy_pickup_code()
returns trigger
language plpgsql
as $$
begin
  new.pickup_code = public.generate_otp();
  return new;
end;
$$;

create trigger set_pharmacy_pickup_code
  before insert on public.pharmacy_orders
  for each row execute function public.set_pharmacy_pickup_code();

-- ---------------------------------------------------------------------------
-- Booking price is always derived from the service catalog, never trusted
-- from the client (an insert policy alone can't stop a consumer from
-- inserting an arbitrary price).
create or replace function public.set_booking_price_from_service()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select price_from into new.price from public.services where id = new.service_id;
  return new;
end;
$$;

create trigger set_booking_price_from_service
  before insert on public.bookings
  for each row execute function public.set_booking_price_from_service();

-- ---------------------------------------------------------------------------
-- professional_profiles.rating/rating_count are derived, never client-set
-- (see column grants in rls_policies) -- recomputed from completed job
-- ratings across bookings, pharmacy_orders, and ambulance_requests, since the
-- README models one shared rating per professional across all their work.
create or replace function public.recompute_rating_for(prof_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professional_profiles
  set rating = coalesce((
        select round(avg(r), 2) from (
          select rating as r from public.bookings where professional_id = prof_id and rating is not null
          union all
          select rating as r from public.pharmacy_orders where pharmacy_id = prof_id and rating is not null
          union all
          select rating as r from public.ambulance_requests where ambulance_partner_id = prof_id and rating is not null
        ) ratings
      ), 0),
      rating_count = (
        select count(*) from (
          select rating as r from public.bookings where professional_id = prof_id and rating is not null
          union all
          select rating as r from public.pharmacy_orders where pharmacy_id = prof_id and rating is not null
          union all
          select rating as r from public.ambulance_requests where ambulance_partner_id = prof_id and rating is not null
        ) ratings
      )
  where profile_id = prof_id;
end;
$$;

create or replace function public.trg_recompute_booking_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.professional_id is not null then
    perform public.recompute_rating_for(new.professional_id);
  end if;
  return new;
end;
$$;

create trigger recompute_rating_on_booking
  after insert or update of rating on public.bookings
  for each row execute function public.trg_recompute_booking_rating();

create or replace function public.trg_recompute_pharmacy_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pharmacy_id is not null then
    perform public.recompute_rating_for(new.pharmacy_id);
  end if;
  return new;
end;
$$;

create trigger recompute_rating_on_pharmacy_order
  after insert or update of rating on public.pharmacy_orders
  for each row execute function public.trg_recompute_pharmacy_rating();

create or replace function public.trg_recompute_ambulance_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ambulance_partner_id is not null then
    perform public.recompute_rating_for(new.ambulance_partner_id);
  end if;
  return new;
end;
$$;

create trigger recompute_rating_on_ambulance_request
  after insert or update of rating on public.ambulance_requests
  for each row execute function public.trg_recompute_ambulance_rating();

-- ---------------------------------------------------------------------------
-- Wallet balance is a derived total, maintained only by inserting rows into
-- wallet_transactions (a service_role-only write -- see rls_policies). This
-- is the sole path that can move a balance, so a user can never set their own
-- balance directly.
create or replace function public.apply_wallet_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'success' then
    update public.wallets
    set balance = balance + (case when new.type = 'credit' then new.amount else -new.amount end),
        updated_at = now()
    where profile_id = new.profile_id;
  end if;
  return new;
end;
$$;

create trigger apply_wallet_transaction
  after insert on public.wallet_transactions
  for each row execute function public.apply_wallet_transaction();
