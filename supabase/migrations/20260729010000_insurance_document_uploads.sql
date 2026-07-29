-- Real document upload for insurance policies and claims. Previously
-- insurance_policies/insurance_claims were text-only (provider name, policy
-- number, claim amount) with no way to attach the actual policy card photo
-- or claim receipt -- so "insurance-ready" invoices had nothing backing the
-- claim itself. Mirrors the professional-documents pattern: a private
-- Storage bucket, path convention {profile_id}/{...}-{timestamp}.{ext}, RLS
-- scoped by the first path segment matching the uploader's own id.

alter table public.insurance_policies add column document_path text;
alter table public.insurance_claims add column document_path text;

insert into storage.buckets (id, name, public)
values ('insurance-documents', 'insurance-documents', false)
on conflict (id) do nothing;

create policy "insurance-documents: owner uploads own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'insurance-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "insurance-documents: owner reads own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'insurance-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "insurance-documents: owner replaces own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'insurance-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'insurance-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "insurance-documents: owner deletes own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'insurance-documents' and (storage.foldername(name))[1] = auth.uid()::text);
