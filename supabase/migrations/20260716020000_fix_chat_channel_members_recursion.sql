-- Fixes a pre-existing bug: the chat_channel_members SELECT/INSERT policies
-- both check membership via `exists (select 1 from chat_channel_members m2
-- where ...)` -- a self-referencing subquery on the very table the policy
-- guards. Postgres re-applies the same RLS policy while evaluating that
-- subquery, which re-triggers itself, and errors with "infinite recursion
-- detected in policy for relation chat_channel_members". This broke adding a
-- second member (e.g. the team admin) to any care_team/ops/escalation
-- channel -- discovered while wiring up the new SOS escalation channel, but
-- it affects the already-shipped care-team and ops chat flows too.
--
-- Fix: move the membership check into a security-definer function (same
-- pattern as team_admin_of/is_admin_of_professional elsewhere), which
-- bypasses RLS on its own internal query instead of re-entering the policy.
create or replace function public.is_channel_member(p_channel_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_channel_members
    where channel_id = p_channel_id and profile_id = p_profile_id
  );
$$;

grant execute on function public.is_channel_member(uuid, uuid) to authenticated;

drop policy "chat_channel_members: visible to fellow members" on public.chat_channel_members;
create policy "chat_channel_members: visible to fellow members"
  on public.chat_channel_members for select to authenticated
  using (profile_id = auth.uid() or public.is_channel_member(channel_id, auth.uid()));

drop policy "chat_channel_members: self-join or invited by a member" on public.chat_channel_members;
create policy "chat_channel_members: self-join or invited by a member"
  on public.chat_channel_members for insert to authenticated
  with check (profile_id = auth.uid() or public.is_channel_member(channel_id, auth.uid()));
