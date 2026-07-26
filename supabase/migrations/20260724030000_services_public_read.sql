-- The consumer welcome screen (curalink.co.in root, served logged-out) now
-- renders the live services catalog so visitors see real offerings instead
-- of static marketing copy. `public.services` only holds non-sensitive
-- catalog data (name, category, price_from, duration, icon) -- no patient or
-- professional PII -- so it's safe to open the same read access already
-- granted to any authenticated user up to anon as well. Nothing else
-- (bookings, professional_credentials, profiles, etc.) is touched.
create policy "services: readable by anon"
  on public.services for select to anon using (true);
