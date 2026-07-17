-- WhatsApp handoff for teleconsults (README: "Video consult" -- real in-app
-- WebRTC is out of scope for now, so the doctor and consumer just message
-- each other on WhatsApp instead). The doctor's side needs the consumer's
-- phone number to build a wa.me link, but no existing policy lets a
-- professional read an arbitrary consumer's profile -- only their own, or
-- another professional's (see "profiles: self or any professional card is
-- readable"). Mirrors the existing "family_members: owner or assigned
-- professional" pattern: readable only when a real booking connects them.
create policy "profiles: assigned professional reads their consumer"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.consumer_id = profiles.id and b.professional_id = auth.uid()
    )
  );
