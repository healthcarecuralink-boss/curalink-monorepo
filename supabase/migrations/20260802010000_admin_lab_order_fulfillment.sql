-- Lab orders previously had no fulfillment path at all: RLS restricted the
-- table to "consumer only", so no professional/admin/staff could ever read
-- a pending order or attach a report -- file_url had no way to get set.
-- Model: any approved admin can manually upload a report on a consumer's
-- behalf (matches an outsourced-lab-partner operating model, not a new
-- "lab technician" professional role). Additive only -- the existing
-- consumer policy is untouched.

create policy "lab_orders: admin reads all"
  on public.lab_orders for select to authenticated
  using (public.has_role('admin'));

create policy "lab_orders: admin fulfills"
  on public.lab_orders for update to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

insert into storage.buckets (id, name, public)
values ('lab-reports', 'lab-reports', false)
on conflict (id) do nothing;

-- Path convention: {consumer_id}/{lab_order_id}/{timestamp}.{ext} -- scoped
-- under the *consumer's* id (not the uploader's, unlike the other document
-- buckets) since the reader here is the consumer, not the admin who upload
-- it on their behalf.
create policy "lab-reports: admin uploads any consumer's folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lab-reports'
    and public.has_role('admin')
  );

create policy "lab-reports: owner or admin reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'lab-reports'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role('admin'))
  );
