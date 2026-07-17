-- Closes a gap found during QA: the "addresses: owner or assigned
-- professional" policy covers bookings and ambulance requests, but never
-- pharmacy orders -- so the assigned pharmacy partner could never actually
-- read a delivery address, needed for the "Pickup map" screen (and anywhere
-- else showing where an order is headed).
create policy "addresses: assigned pharmacy partner"
  on public.addresses for select to authenticated
  using (
    exists (
      select 1 from public.pharmacy_orders po
      where po.delivery_address_id = addresses.id and po.pharmacy_id = auth.uid()
    )
  );
