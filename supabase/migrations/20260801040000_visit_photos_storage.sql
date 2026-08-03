-- Real storage for visit photos captured during a nurse/vet home visit
-- (visit/[id]/index.tsx "Photos" tab). That tab previously just incremented
-- a local counter on tap with nothing behind it -- no photo was ever
-- captured or stored, so "N photos noted" was purely cosmetic.
--
-- Path convention matches professional-documents:
-- {professional_id}/{booking_id}/{timestamp}.{ext}, so RLS can scope
-- access by the first path segment matching the uploader's own id.

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', false)
on conflict (id) do nothing;

-- Owner (the professional who took the photo) can upload into their own
-- folder only.
create policy "visit-photos: owner uploads own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read/remove their own files; CuraLink staff can read any file
-- (same is_curalink_staff() helper professional-documents already uses).
create policy "visit-photos: owner or staff reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'visit-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_curalink_staff())
  );

create policy "visit-photos: owner deletes own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
