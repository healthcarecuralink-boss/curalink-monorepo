-- Admin dispatch map needs to see the live GPS stream for jobs assigned to
-- their own team members, but can_view_job_location() (used by the existing
-- "provider_locations: viewable by job's consumer or professional" policy)
-- only checks the job's consumer/professional -- an admin is neither. Adds a
-- second, additive SELECT policy scoped by the existing is_admin_of_professional
-- helper (same one bookings/payout_records already use for admin aggregate views).
create policy "provider_locations: admin views their team's locations"
  on public.provider_locations for select to authenticated
  using (public.is_admin_of_professional(professional_id));
