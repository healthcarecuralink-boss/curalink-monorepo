-- The existing select policies on bookings/pharmacy_orders/ambulance_requests
-- only grant visibility once professional_id/pharmacy_id/ambulance_partner_id
-- is set to the calling user. A freshly created, unassigned job has that
-- column NULL, so no professional could ever SELECT it -- the "claim an
-- unassigned job" update policies were unreachable in practice, since a
-- professional's client can't discover the row to update (fetchAvailableJobs
-- et al. returned empty), and Realtime's postgres_changes feed is RLS-aware
-- so the INSERT never reached CuraLink Plus either.

create policy "bookings: any professional sees the open job pool"
  on public.bookings for select to authenticated
  using (
    professional_id is null
    and status = 'pending'
    and array_length(public.current_roles(), 1) is not null
  );

create policy "pharmacy_orders: any pharmacy partner sees the open order pool"
  on public.pharmacy_orders for select to authenticated
  using (
    pharmacy_id is null
    and status = 'placed'
    and array_length(public.current_roles(), 1) is not null
  );

create policy "ambulance_requests: any partner sees the open request pool"
  on public.ambulance_requests for select to authenticated
  using (
    ambulance_partner_id is null
    and status = 'requested'
    and array_length(public.current_roles(), 1) is not null
  );
