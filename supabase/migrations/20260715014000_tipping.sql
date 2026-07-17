-- Tipping from wallet balance. wallet_transactions has no client insert
-- policy at all (Step 2: "balances change only via server-confirmed
-- writes") so this must be a security-definer function, not a client-side
-- insert -- it checks the booking belongs to the caller, checks sufficient
-- balance, and does both writes (ledger insert + bookings.tip_amount) in one
-- atomic call so a tip can't be double-applied or leave the two fields
-- out of sync.
create or replace function public.pay_tip_from_wallet(p_booking_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_consumer_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'tip amount must be positive';
  end if;

  select consumer_id into v_consumer_id from public.bookings where id = p_booking_id;
  if v_consumer_id is null or v_consumer_id <> auth.uid() then
    raise exception 'not your booking';
  end if;

  select balance into v_balance from public.wallets where profile_id = auth.uid();
  if coalesce(v_balance, 0) < p_amount then
    raise exception 'insufficient wallet balance';
  end if;

  insert into public.wallet_transactions (profile_id, type, amount, method, description, reference)
  values (auth.uid(), 'debit', p_amount, 'wallet', 'Tip for visit', p_booking_id::text);

  update public.bookings set tip_amount = tip_amount + p_amount where id = p_booking_id;
end;
$$;

grant execute on function public.pay_tip_from_wallet(uuid, numeric) to authenticated;

-- tip_amount was in the general bookings column grant from Step 2 (harmless
-- at the time -- nothing surfaced it in the UI). Now that a real tip
-- mechanism exists, leaving it directly client-writable would let someone
-- inflate tip_amount without actually debiting their wallet, corrupting the
-- professional-earnings totals that sum price + tip_amount. Re-grant the
-- same column list minus tip_amount so pay_tip_from_wallet() is the only path.
revoke update on public.bookings from authenticated;
grant update (
  professional_id, address_id, status, is_express, scheduled_at,
  vitals, notes, meds_given, lab_reports, handoff_note,
  rating, review, cancelled_reason
) on public.bookings to authenticated;
