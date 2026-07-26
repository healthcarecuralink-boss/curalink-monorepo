-- Real storage for the professional onboarding document upload
-- (professional-details-2.tsx). That screen previously just toggled a local
-- boolean per document slot and wrote a fake {"type":..., "status":
-- "pending_review"} entry into professional_credentials.docs -- no file was
-- ever stored, so a "submitted" document had nothing behind it for staff to
-- actually review.
--
-- Path convention: {profile_id}/{doc_type}-{timestamp}.{ext}, so RLS can
-- scope access by the first path segment matching the uploader's own id.

insert into storage.buckets (id, name, public)
values ('professional-documents', 'professional-documents', false)
on conflict (id) do nothing;

-- Owner can upload into their own folder only.
create policy "professional-documents: owner uploads own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'professional-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read/replace/remove their own files; CuraLink staff can read
-- any file for verification review (same is_curalink_staff() helper the
-- verification queue already uses).
create policy "professional-documents: owner or staff reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'professional-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_curalink_staff())
  );

create policy "professional-documents: owner replaces own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'professional-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'professional-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "professional-documents: owner deletes own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'professional-documents' and (storage.foldername(name))[1] = auth.uid()::text);
