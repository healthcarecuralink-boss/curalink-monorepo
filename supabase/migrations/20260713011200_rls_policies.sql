-- Row-Level Security policies.
-- Access rules per README: "consumer sees own bookings; provider sees only
-- assigned jobs; admin sees only their team."

-- ---------------------------------------------------------------- profiles
create policy "profiles: self or any professional card is readable"
  on public.profiles for select to authenticated
  using (id = auth.uid() or array_length(roles, 1) is not null);

create policy "profiles: insert own row"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles: update own row"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-level grant: `roles` (and identity/audit columns) are excluded from
-- the client UPDATE grant on purpose. The row-level policy above would
-- otherwise let a user grant themselves e.g. {admin} directly. The only
-- legitimate paths to changing roles are request_role/approve_role above.
revoke update on public.profiles from authenticated;
grant update (full_name, email, avatar_url) on public.profiles to authenticated;

-- ------------------------------------------------- professional_profiles
-- Public-facing provider-card data: readable by any authenticated user so
-- consumer booking screens can browse/match providers.
create policy "professional_profiles: readable by any authenticated user"
  on public.professional_profiles for select to authenticated
  using (true);

-- No client insert policy: the row is always created server-side by the
-- ensure_professional_rows trigger when a role is approved. A direct client
-- insert could otherwise self-set rating/rating_count.

create policy "professional_profiles: self update"
  on public.professional_profiles for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Column-level grant: rating/rating_count are derived (see
-- recompute_rating_for in the functions migration), never self-set.
revoke update on public.professional_profiles from authenticated;
grant update (
  bio, years_experience, is_on_duty, availability, service_area, lat, lng
) on public.professional_profiles to authenticated;

-- ------------------------------------------------ professional_credentials
-- No client insert policy: the row is always created server-side, either by
-- request_role() or the ensure_professional_rows trigger (both security
-- definer). A direct client insert could otherwise set verification_status
-- or pending_roles to anything it likes.
create policy "professional_credentials: self or admin of team"
  on public.professional_credentials for select to authenticated
  using (profile_id = auth.uid() or public.is_admin_of_professional(profile_id));

create policy "professional_credentials: self update"
  on public.professional_credentials for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Column-level grant: verification_status and pending_roles are excluded --
-- a professional must not be able to self-approve. verification_status only
-- changes via approve_role; pending_roles via request_role/approve_role.
revoke update on public.professional_credentials from authenticated;
grant update (credentials, docs, bank_details) on public.professional_credentials to authenticated;

-- ------------------------------------------------------------------ teams
create policy "teams: admin only"
  on public.teams for select to authenticated
  using (admin_id = auth.uid());

create policy "teams: admin creates own team"
  on public.teams for insert to authenticated
  with check (admin_id = auth.uid() and public.has_role('admin'));

create policy "teams: admin updates own team"
  on public.teams for update to authenticated
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

create policy "teams: admin deletes own team"
  on public.teams for delete to authenticated
  using (admin_id = auth.uid());

-- ---------------------------------------------------------- team_members
create policy "team_members: member or team admin"
  on public.team_members for select to authenticated
  using (
    professional_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid())
  );

create policy "team_members: team admin writes roster"
  on public.team_members for insert to authenticated
  with check (exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid()));

create policy "team_members: team admin updates roster"
  on public.team_members for update to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid()))
  with check (exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid()));

create policy "team_members: team admin removes roster entry"
  on public.team_members for delete to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.admin_id = auth.uid()));

-- ------------------------------------------------------------- payout_methods
create policy "payout_methods: self only"
  on public.payout_methods for all to authenticated
  using (professional_id = auth.uid())
  with check (professional_id = auth.uid());

-- ------------------------------------------------------------- payout_records
-- No insert/update/delete policy: records are system-generated (service_role only).
create policy "payout_records: self or admin aggregate"
  on public.payout_records for select to authenticated
  using (professional_id = auth.uid() or public.is_admin_of_professional(professional_id));

-- ------------------------------------------------------------- family_members
create policy "family_members: owner or assigned professional"
  on public.family_members for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.patient_id = family_members.id and b.professional_id = auth.uid()
    )
  );

create policy "family_members: owner writes"
  on public.family_members for insert to authenticated
  with check (owner_id = auth.uid());

create policy "family_members: owner updates"
  on public.family_members for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "family_members: owner deletes"
  on public.family_members for delete to authenticated
  using (owner_id = auth.uid());

-- ------------------------------------------------------------------ addresses
create policy "addresses: owner or assigned professional"
  on public.addresses for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.address_id = addresses.id and b.professional_id = auth.uid()
    )
    or exists (
      select 1 from public.ambulance_requests a
      where a.pickup_address_id = addresses.id and a.ambulance_partner_id = auth.uid()
    )
  );

create policy "addresses: owner writes"
  on public.addresses for insert to authenticated
  with check (owner_id = auth.uid());

create policy "addresses: owner updates"
  on public.addresses for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "addresses: owner deletes"
  on public.addresses for delete to authenticated
  using (owner_id = auth.uid());

-- -------------------------------------------------------------------- services
-- Public catalog. No client insert/update/delete (managed by back office / seed).
create policy "services: readable by any authenticated user"
  on public.services for select to authenticated
  using (true);

-- -------------------------------------------------------------------- bookings
create policy "bookings: consumer, assigned professional, or their admin"
  on public.bookings for select to authenticated
  using (
    consumer_id = auth.uid()
    or professional_id = auth.uid()
    or public.is_admin_of_professional(professional_id)
  );

create policy "bookings: consumer creates"
  on public.bookings for insert to authenticated
  with check (consumer_id = auth.uid());

create policy "bookings: consumer or assigned professional updates"
  on public.bookings for update to authenticated
  using (consumer_id = auth.uid() or professional_id = auth.uid())
  with check (consumer_id = auth.uid() or professional_id = auth.uid());

-- A pending, unassigned job can be claimed by any professional (the "nearest
-- available provider" flow assigns professional_id = the accepting user).
create policy "bookings: professional accepts an unassigned job"
  on public.bookings for update to authenticated
  using (professional_id is null and status = 'pending')
  with check (professional_id = auth.uid());

-- Column-level grant: payment_status/razorpay_*/price/arrival_otp are
-- excluded from the client UPDATE grant. Payment confirmation must come from
-- a server-verified Razorpay webhook, price from the service catalog trigger,
-- and the OTP is only ever set server-side (see functions migration) --
-- none of these should be directly writable by consumer or professional.
revoke update on public.bookings from authenticated;
grant update (
  professional_id, address_id, status, is_express, scheduled_at,
  vitals, notes, meds_given, lab_reports, handoff_note,
  rating, review, tip_amount, cancelled_reason
) on public.bookings to authenticated;

-- ----------------------------------------------------------- provider_locations
create policy "provider_locations: viewable by job's consumer or professional"
  on public.provider_locations for select to authenticated
  using (public.can_view_job_location(job_type, job_id));

create policy "provider_locations: assigned professional publishes"
  on public.provider_locations for insert to authenticated
  with check (professional_id = auth.uid() and public.can_view_job_location(job_type, job_id));

create policy "provider_locations: assigned professional updates"
  on public.provider_locations for update to authenticated
  using (professional_id = auth.uid())
  with check (professional_id = auth.uid() and public.can_view_job_location(job_type, job_id));

-- ------------------------------------------------------------- prescriptions
create policy "prescriptions: doctor or patient owner"
  on public.prescriptions for select to authenticated
  using (
    doctor_id = auth.uid()
    or exists (
      select 1 from public.family_members f
      where f.id = patient_id and f.owner_id = auth.uid()
    )
  );

create policy "prescriptions: doctor writes"
  on public.prescriptions for insert to authenticated
  with check (doctor_id = auth.uid() and public.has_role('doctor'));

create policy "prescriptions: doctor updates"
  on public.prescriptions for update to authenticated
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

-- --------------------------------------------------------------- lab_orders
create policy "lab_orders: consumer only"
  on public.lab_orders for all to authenticated
  using (consumer_id = auth.uid())
  with check (consumer_id = auth.uid());

-- ----------------------------------------------------------- pharmacy_orders
create policy "pharmacy_orders: consumer, pharmacy, or their admin"
  on public.pharmacy_orders for select to authenticated
  using (
    consumer_id = auth.uid()
    or pharmacy_id = auth.uid()
    or public.is_admin_of_professional(pharmacy_id)
  );

create policy "pharmacy_orders: consumer or assigned nurse creates"
  on public.pharmacy_orders for insert to authenticated
  with check (
    consumer_id = auth.uid()
    or public.is_assigned_provider_for_patient(patient_id)
  );

create policy "pharmacy_orders: consumer or pharmacy updates"
  on public.pharmacy_orders for update to authenticated
  using (consumer_id = auth.uid() or pharmacy_id = auth.uid())
  with check (consumer_id = auth.uid() or pharmacy_id = auth.uid());

-- An unassigned order can be claimed by any pharmacy partner.
create policy "pharmacy_orders: pharmacy claims an unassigned order"
  on public.pharmacy_orders for update to authenticated
  using (pharmacy_id is null and status = 'placed')
  with check (pharmacy_id = auth.uid());

-- Column-level grant: pickup_code is server-generated only (see functions
-- migration) and total_price is not client-writable after creation.
revoke update on public.pharmacy_orders from authenticated;
grant update (
  pharmacy_id, delivery_address_id, items, status, rating, review
) on public.pharmacy_orders to authenticated;

-- -------------------------------------------------------- ambulance_requests
create policy "ambulance_requests: consumer, partner, or their admin"
  on public.ambulance_requests for select to authenticated
  using (
    consumer_id = auth.uid()
    or ambulance_partner_id = auth.uid()
    or public.is_admin_of_professional(ambulance_partner_id)
  );

create policy "ambulance_requests: consumer or any Plus professional (SOS) creates"
  on public.ambulance_requests for insert to authenticated
  with check (
    consumer_id = auth.uid()
    or array_length(public.current_roles(), 1) is not null
  );

create policy "ambulance_requests: consumer or partner updates"
  on public.ambulance_requests for update to authenticated
  using (consumer_id = auth.uid() or ambulance_partner_id = auth.uid())
  with check (consumer_id = auth.uid() or ambulance_partner_id = auth.uid());

-- An unassigned request can be claimed by any ambulance partner.
create policy "ambulance_requests: partner claims an unassigned request"
  on public.ambulance_requests for update to authenticated
  using (ambulance_partner_id is null and status = 'requested')
  with check (ambulance_partner_id = auth.uid());

-- ------------------------------------------------------------------- wallets
-- No client update policy on wallets: balance only ever changes via the
-- maintain_wallet_balance trigger reacting to a service_role-inserted
-- wallet_transaction (see functions migration) -- never a direct write,
-- which would otherwise let a user set their own balance to anything.
create policy "wallets: self only"
  on public.wallets for select to authenticated
  using (profile_id = auth.uid());

-- No client insert/update policy on wallet_transactions: balances change only
-- via server-confirmed (Razorpay webhook / service_role) writes.
create policy "wallet_transactions: self only"
  on public.wallet_transactions for select to authenticated
  using (profile_id = auth.uid());

-- ------------------------------------------------------------- chat_channels
create policy "chat_channels: members only"
  on public.chat_channels for select to authenticated
  using (
    exists (
      select 1 from public.chat_channel_members m
      where m.channel_id = id and m.profile_id = auth.uid()
    )
  );

create policy "chat_channels: any authenticated user creates"
  on public.chat_channels for insert to authenticated
  with check (true);

-- ----------------------------------------------------- chat_channel_members
create policy "chat_channel_members: visible to fellow members"
  on public.chat_channel_members for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.chat_channel_members m2
      where m2.channel_id = channel_id and m2.profile_id = auth.uid()
    )
  );

create policy "chat_channel_members: self-join or invited by a member"
  on public.chat_channel_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    or exists (
      select 1 from public.chat_channel_members m2
      where m2.channel_id = channel_id and m2.profile_id = auth.uid()
    )
  );

-- ------------------------------------------------------------- chat_messages
create policy "chat_messages: visible to channel members"
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.chat_channel_members m
      where m.channel_id = chat_messages.channel_id and m.profile_id = auth.uid()
    )
  );

create policy "chat_messages: channel members post as themselves"
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_channel_members m
      where m.channel_id = chat_messages.channel_id and m.profile_id = auth.uid()
    )
  );

-- ------------------------------------------------------------- notifications
create policy "notifications: self only"
  on public.notifications for select to authenticated
  using (profile_id = auth.uid());

create policy "notifications: self marks read"
  on public.notifications for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
