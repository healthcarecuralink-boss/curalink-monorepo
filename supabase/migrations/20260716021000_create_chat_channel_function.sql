-- Fixes a second pre-existing bug found while wiring up SOS: every
-- fetchOrCreate*Channel() helper does `.insert({...}).select().single()`,
-- and Postgres re-checks the table's SELECT policy against RETURNING rows.
-- chat_channels' SELECT policy requires an existing chat_channel_members row
-- for the caller -- which can't exist yet for a channel that was just
-- created in the same statement. Every real attempt to create a *new*
-- care-team, ops, or escalation channel has therefore failed with "new row
-- violates row-level security policy for table chat_channels" (confirmed
-- live). A plain insert with no RETURNING works fine, so this function does
-- the insert + first membership row atomically server-side and returns the
-- channel via a security-definer path that bypasses the chicken-and-egg
-- RETURNING check entirely.
create or replace function public.create_chat_channel(p_type text, p_booking_id uuid, p_extra_member_id uuid default null)
returns public.chat_channels
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel public.chat_channels;
begin
  insert into public.chat_channels (type, booking_id) values (p_type::chat_channel_type, p_booking_id) returning * into v_channel;
  insert into public.chat_channel_members (channel_id, profile_id) values (v_channel.id, auth.uid())
    on conflict (channel_id, profile_id) do nothing;
  if p_extra_member_id is not null then
    insert into public.chat_channel_members (channel_id, profile_id) values (v_channel.id, p_extra_member_id)
      on conflict (channel_id, profile_id) do nothing;
  end if;
  return v_channel;
end;
$$;

grant execute on function public.create_chat_channel(text, uuid, uuid) to authenticated;
