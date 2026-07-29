-- Lets a professional see a patient's allergies/conditions while deciding
-- whether to accept a job, not only after they've already accepted it.
-- Mirrors the exact same "open job pool" visibility condition already
-- established for bookings themselves (20260720010000_unassigned_job_visibility.sql):
-- visible only while the booking is pending and unassigned, to any
-- authenticated professional. The moment someone accepts, professional_id is
-- no longer null, so this policy stops applying to everyone except the
-- assignee (who already has access via the existing "owner or assigned
-- professional" policy) -- pool-wide visibility is correctly revoked, not
-- left open.

create policy "family_members: visible via open job pool"
  on public.family_members for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.patient_id = family_members.id
        and b.professional_id is null
        and b.status = 'pending'
        and array_length(public.current_roles(), 1) is not null
    )
  );
