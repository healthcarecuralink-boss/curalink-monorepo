-- =============================================================================
-- Demo / staging seed data for CuraLink + CuraLink Plus.
-- Names, neighborhoods, service pricing, and sample orders are pulled from the
-- design prototypes (prototypes/CuraLink.dc.html, prototypes/CuraLink Plus.dc.html)
-- so local/staging dev matches what's on screen in the design spec.
--
-- Inserting directly into auth.users is the standard way to seed demo
-- identities in a Supabase project (profiles.id has an FK to auth.users, so
-- there is no other way to satisfy it). These accounts have no usable
-- password and are not meant to be logged into -- they exist only to own the
-- seed rows below.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------
-- 1. Identities: 1 consumer + 16 professionals + 1 partner admin.
--    profiles + wallets rows are created automatically by the
--    handle_new_user trigger; roles start empty and are granted below.
-- -----------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, phone, encrypted_password,
  phone_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000001', 'authenticated', 'authenticated', '+919876543001', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Priya Nair"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000002', 'authenticated', 'authenticated', '+919876543002', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Meera Krishnan"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000003', 'authenticated', 'authenticated', '+919876543003', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Rajesh Kumar"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000004', 'authenticated', 'authenticated', '+919876543004', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Ananya Rao"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000005', 'authenticated', 'authenticated', '+919876543005', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Suresh Menon"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000006', 'authenticated', 'authenticated', '+919876543006', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Kavya Reddy"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000007', 'authenticated', 'authenticated', '+919876543007', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Vaibhav Shetty"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000008', 'authenticated', 'authenticated', '+919876543008', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Priya Sharma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000009', 'authenticated', 'authenticated', '+919876543009', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Kavya Krishnan"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000010', 'authenticated', 'authenticated', '+919876543010', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Rajesh Reddy"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000011', 'authenticated', 'authenticated', '+919876543011', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Dr. Suresh Kumar"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000012', 'authenticated', 'authenticated', '+919876543012', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Meera Nair"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000013', 'authenticated', 'authenticated', '+919876543013', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Anjali Rao"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000014', 'authenticated', 'authenticated', '+919876543014', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Apollo Pharmacy — Kondapur"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000015', 'authenticated', 'authenticated', '+919876543015', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"MedPlus — Jubilee Hills"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000016', 'authenticated', 'authenticated', '+919876543016', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Rapid Response Ambulance Services"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000017', 'authenticated', 'authenticated', '+919876543017', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Sanjeevani Ambulance Fleet"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0001-000000000018', 'authenticated', 'authenticated', '+919876543018', crypt(gen_random_uuid()::text, gen_salt('bf')), now(), '', '', '', '', '{"provider":"phone","providers":["phone"]}', '{"full_name":"Anitha Reddy"}', now(), now())
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 2. Grant roles (bypasses request_role/approve_role -- seed data
--    represents an already-approved end state). This fires
--    ensure_professional_rows, creating professional_profiles /
--    professional_credentials rows for each.
-- -----------------------------------------------------------------------
update public.profiles set roles = array['nurse'] where id = '00000000-0000-0000-0001-000000000002';
-- Physiotherapists are managed under the 'nurse' Plus role -- the README's
-- CuraLink Plus role model has 6 roles (nurse/vet/doctor/pharmacy/ambulance/
-- admin) and groups "Nurse / Vet" as one persona; physio isn't a separate
-- Plus role, only a consumer-facing service category.
update public.profiles set roles = array['nurse'] where id = '00000000-0000-0000-0001-000000000003'; -- Rajesh Kumar, physio
update public.profiles set roles = array['doctor'] where id = '00000000-0000-0000-0001-000000000004';
update public.profiles set roles = array['doctor'] where id = '00000000-0000-0000-0001-000000000005';
update public.profiles set roles = array['doctor'] where id = '00000000-0000-0000-0001-000000000006';
update public.profiles set roles = array['vet'] where id = '00000000-0000-0000-0001-000000000007';
-- Priya Sharma also holds admin (multi-role, for exercising the CuraLink
-- Plus role switcher end to end -- README: "+ Add role", zero re-auth).
update public.profiles set roles = array['nurse', 'admin'] where id = '00000000-0000-0000-0001-000000000008';
update public.profiles set roles = array['nurse'] where id = '00000000-0000-0000-0001-000000000009';
update public.profiles set roles = array['doctor'] where id = '00000000-0000-0000-0001-000000000010';
update public.profiles set roles = array['vet'] where id = '00000000-0000-0000-0001-000000000011';
update public.profiles set roles = array['nurse'] where id = '00000000-0000-0000-0001-000000000012'; -- Meera Nair, physio
update public.profiles set roles = array['nurse'] where id = '00000000-0000-0000-0001-000000000013';
update public.profiles set roles = array['pharmacy'] where id = '00000000-0000-0000-0001-000000000014';
update public.profiles set roles = array['pharmacy'] where id = '00000000-0000-0000-0001-000000000015';
update public.profiles set roles = array['ambulance'] where id = '00000000-0000-0000-0001-000000000016';
update public.profiles set roles = array['ambulance'] where id = '00000000-0000-0000-0001-000000000017';
update public.profiles set roles = array['admin'] where id = '00000000-0000-0000-0001-000000000018';

-- -----------------------------------------------------------------------
-- 3. Professional public-card details.
-- -----------------------------------------------------------------------
update public.professional_profiles set bio = 'Registered Nurse · NIMS Hyderabad', years_experience = 9, is_on_duty = true, service_area = 'Kondapur', lat = 17.4615, lng = 78.3556 where profile_id = '00000000-0000-0000-0001-000000000002';
update public.professional_profiles set bio = 'BPT, MPT (Ortho)', years_experience = 7, is_on_duty = true, service_area = 'Kondapur', lat = 17.4615, lng = 78.3556 where profile_id = '00000000-0000-0000-0001-000000000003';
update public.professional_profiles set bio = 'MBBS, MD · Care lead · Internal medicine · Apollo Hyderabad', years_experience = 12, is_on_duty = true, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000004';
update public.professional_profiles set bio = 'Orthopedics', is_on_duty = true, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000005';
update public.professional_profiles set bio = 'Pediatrics', is_on_duty = true, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000006';
update public.professional_profiles set bio = 'Veterinarian', is_on_duty = true, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000007';
update public.professional_profiles set is_on_duty = true, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000008';
update public.professional_profiles set is_on_duty = true, service_area = 'Kondapur', lat = 17.4615, lng = 78.3556 where profile_id = '00000000-0000-0000-0001-000000000009';
update public.professional_profiles set is_on_duty = true, service_area = 'Teleconsult' where profile_id = '00000000-0000-0000-0001-000000000010';
update public.professional_profiles set is_on_duty = false, service_area = 'Off shift' where profile_id = '00000000-0000-0000-0001-000000000011';
update public.professional_profiles set is_on_duty = true, service_area = 'Madhapur', lat = 17.4483, lng = 78.3915 where profile_id = '00000000-0000-0000-0001-000000000012';
update public.professional_profiles set is_on_duty = false, service_area = 'On break' where profile_id = '00000000-0000-0000-0001-000000000013';
update public.professional_profiles set bio = '24/7 home delivery pharmacy', is_on_duty = true, service_area = 'Kondapur', lat = 17.4615, lng = 78.3556 where profile_id = '00000000-0000-0000-0001-000000000014';
update public.professional_profiles set bio = 'Injectable medicines stock specialist', is_on_duty = false, service_area = 'Jubilee Hills', lat = 17.4326, lng = 78.4071 where profile_id = '00000000-0000-0000-0001-000000000015';
update public.professional_profiles set bio = 'BLS/ALS ambulance fleet', is_on_duty = true, service_area = 'Banjara Hills', lat = 17.4156, lng = 78.4347 where profile_id = '00000000-0000-0000-0001-000000000016';
update public.professional_profiles set bio = 'BLS/ALS ambulance fleet', is_on_duty = true, service_area = 'Gachibowli', lat = 17.4401, lng = 78.3489 where profile_id = '00000000-0000-0000-0001-000000000017';

update public.professional_credentials set verification_status = 'approved', docs = '[{"type":"id_proof","status":"approved"}]'::jsonb where profile_id in (
  select id from public.profiles where array_length(roles, 1) is not null
);

-- -----------------------------------------------------------------------
-- 4. Partner Admin team + roster (README: "Team roster").
-- -----------------------------------------------------------------------
insert into public.teams (id, admin_id, name) values
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000018', 'Hyderabad Central')
on conflict (id) do nothing;

insert into public.team_members (team_id, professional_id, role, status, docs_ok) values
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000009', 'nurse', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000008', 'nurse', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000010', 'doctor', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000011', 'vet', 'inactive', false),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000012', 'nurse', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000013', 'nurse', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000014', 'pharmacy', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000015', 'pharmacy', 'inactive', false),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000016', 'ambulance', 'active', true),
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000017', 'ambulance', 'active', true)
on conflict (team_id, professional_id, role) do nothing;

-- -----------------------------------------------------------------------
-- 5. Priya Nair's family (the Nair household + pet).
-- -----------------------------------------------------------------------
insert into public.family_members (id, owner_id, full_name, relation, date_of_birth, gender, species, blood_group, allergies, conditions, is_self) values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Priya Nair', 'Self', '1994-03-14', 'female', null, null, '{}', '{}', true),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Rajesh Nair', 'Father', '1959-01-20', 'male', null, null, '{Penicillin}', '{"Type 2 diabetes","Hypertension"}', false),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', 'Meera Nair', 'Mother', '1965-07-02', 'female', null, null, '{}', '{"Osteoarthritis (knee)"}', false),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000001', 'Aarav Nair', 'Son', '2020-09-11', 'male', null, null, '{Peanuts}', '{"Mild asthma"}', false),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000001', 'Simba', 'Pet', '2023-04-01', null, 'Golden Retriever', null, '{}', '{}', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 5b. Emergency contacts.
-- -----------------------------------------------------------------------
insert into public.emergency_contacts (id, owner_id, full_name, relation, phone, is_primary) values
  ('00000000-0000-0000-000c-000000000001', '00000000-0000-0000-0001-000000000001', 'Vaibhav Nair', 'Brother', '+919876500001', true),
  ('00000000-0000-0000-000c-000000000002', '00000000-0000-0000-0001-000000000001', 'Sunita Nair', 'Aunt', '+919876500002', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 6. Addresses.
-- -----------------------------------------------------------------------
insert into public.addresses (id, owner_id, label, line1, neighborhood, city, pincode, lat, lng, is_default) values
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000001', 'Home', 'Villa 23, Road No. 45', 'Jubilee Hills', 'Hyderabad', '500033', 17.4326, 78.4071, true),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000001', 'Parents'' home', 'Flat 502, Aparna Towers', 'Kondapur', 'Hyderabad', '500084', 17.4615, 78.3556, false),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000001', 'Office', 'Krishe Emerald, Kondapur Rd', 'Madhapur', 'Hyderabad', '500081', 17.4483, 78.3915, false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 7. Service catalog (exact names/prices/durations from the prototype's
--    sub-service lists).
-- -----------------------------------------------------------------------
insert into public.services (id, category, name, description, price_from, duration_mins, is_express_eligible, sort_order) values
  ('00000000-0000-0000-0004-000000000001', 'nurse', 'Injection & IV drip', 'Injections, dressing, elder care', 499, 40, true, 1),
  ('00000000-0000-0000-0004-000000000002', 'nurse', 'Wound dressing', 'Injections, dressing, elder care', 599, 30, true, 2),
  ('00000000-0000-0000-0004-000000000003', 'nurse', 'Vaccination at home', 'Injections, dressing, elder care', 649, 20, true, 3),
  ('00000000-0000-0000-0004-000000000004', 'nurse', 'Catheter/tube care', 'Injections, dressing, elder care', 799, 45, false, 4),
  ('00000000-0000-0000-0004-000000000005', 'nurse', 'Post-surgical care', 'Injections, dressing, elder care', 1199, 75, false, 5),
  ('00000000-0000-0000-0004-000000000006', 'elder', 'Elderly day care (8 hr)', 'Daily companion visits', 1499, 480, false, 6),
  ('00000000-0000-0000-0004-000000000007', 'doctor', 'GP consultation', 'GP consult at home', 799, 30, true, 7),
  ('00000000-0000-0000-0004-000000000008', 'doctor', 'Senior specialist visit', 'Geriatric / internal medicine', 1999, 45, false, 8),
  ('00000000-0000-0000-0004-000000000009', 'pediatric', 'Pediatric visit', 'Doctor visit for children', 1199, 30, false, 9),
  ('00000000-0000-0000-0004-000000000010', 'physio', 'Physiotherapy session', 'Recovery & mobility', 899, 45, false, 10),
  ('00000000-0000-0000-0004-000000000011', 'physio', 'Post-stroke rehab', 'Recovery & mobility', 1299, 60, false, 11),
  ('00000000-0000-0000-0004-000000000012', 'vet', 'Vet consultation', 'For your furry family', 1299, 40, false, 12),
  ('00000000-0000-0000-0004-000000000013', 'vet', 'Pet vaccination', 'For your furry family', 999, 20, false, 13),
  ('00000000-0000-0000-0004-000000000014', 'lab', 'Full body checkup', 'Sample pickup at home', 1499, 15, false, 14),
  ('00000000-0000-0000-0004-000000000015', 'lab', 'Basic blood panel (CBC, sugar, thyroid)', 'Sample pickup at home', 299, 10, false, 15)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 8. Bookings. price/arrival_otp are set by trigger, not specified here.
-- -----------------------------------------------------------------------
insert into public.bookings (id, consumer_id, patient_id, service_id, professional_id, address_id, status, scheduled_at, payment_status, rating, review, created_at) values
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0004-000000000010', '00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0003-000000000002', 'completed', '2026-06-28 09:00:00+05:30', 'paid', 5, 'Great session, very professional.', '2026-06-28 09:00:00+05:30'),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0004-000000000009', '00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0003-000000000001', 'completed', '2026-06-15 16:00:00+05:30', 'paid', 5, 'Dr. Rao was wonderful with Aarav.', '2026-06-15 16:00:00+05:30'),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0003-000000000002', 'completed', '2026-06-02 09:00:00+05:30', 'paid', 4, 'On time and gentle.', '2026-06-02 09:00:00+05:30'),
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0004-000000000012', '00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0003-000000000001', 'cancelled', '2026-05-20 14:00:00+05:30', 'refunded', null, null, '2026-05-20 12:00:00+05:30')
on conflict (id) do nothing;

update public.bookings set cancelled_reason = 'Rescheduled by consumer' where id = '00000000-0000-0000-0006-000000000004';

-- Vitals recorded during the two completed nurse/elder-care visits, so the
-- consumer Vitals dashboard has real history to show rather than being empty.
update public.bookings set vitals = '{"blood_pressure":"122/80","pulse":"76 bpm","spo2":"98%","temperature":"98.4°F"}'::jsonb
  where id = '00000000-0000-0000-0006-000000000001';
update public.bookings set vitals = '{"blood_pressure":"130/85","pulse":"80 bpm","spo2":"97%","blood_sugar":"110 mg/dL"}'::jsonb
  where id = '00000000-0000-0000-0006-000000000003';

-- A live job for exercising the tracking/GPS-publish flow end to end.
insert into public.bookings (id, consumer_id, patient_id, service_id, professional_id, address_id, status, scheduled_at, payment_status) values
  ('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0003-000000000001', 'en_route', now(), 'paid')
on conflict (id) do nothing;

insert into public.provider_locations (job_type, job_id, professional_id, lat, lng, heading) values
  ('booking', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0001-000000000008', 17.4300, 78.4050, 45)
on conflict (job_type, job_id) do nothing;

-- -----------------------------------------------------------------------
-- 9. Prescriptions.
-- -----------------------------------------------------------------------
insert into public.prescriptions (id, patient_id, doctor_id, booking_id, meds, advice, status, issued_at) values
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0006-000000000002',
    '[{"name":"Paracetamol syrup","dosage":"250mg","frequency":"3x/day","duration":"3 days"},{"name":"Cetirizine syrup","dosage":"5mg","frequency":"1x/night","duration":"5 days"},{"name":"ORS sachets","dosage":"1 sachet","frequency":"as needed","duration":"5 days"}]'::jsonb,
    'Viral fever — plenty of fluids, follow up if fever persists beyond 3 days.', 'active', '2026-06-15 16:45:00+05:30'),
  ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000005', null,
    '[{"name":"Etoricoxib","dosage":"60mg","frequency":"1x/day","duration":"7 days"},{"name":"Calcium + D3","dosage":"1 tablet","frequency":"1x/day","duration":"30 days"}]'::jsonb,
    'Knee pain — avoid stairs, apply warm compress.', 'completed', '2026-05-04 11:00:00+05:30'),
  ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000004', null,
    '[{"name":"Metformin","dosage":"500mg","frequency":"2x/day","duration":"30 days"},{"name":"Telmisartan","dosage":"40mg","frequency":"1x/day","duration":"30 days"}]'::jsonb,
    'Diabetes review — continue home glucose monitoring.', 'active', '2026-04-18 10:00:00+05:30')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 10. Lab orders.
-- -----------------------------------------------------------------------
insert into public.lab_orders (id, consumer_id, patient_id, tests, status, scheduled_at, price, created_at) values
  ('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '{"Full body checkup"}', 'completed', '2026-06-02 08:00:00+05:30', 1499, '2026-06-02 08:00:00+05:30'),
  ('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', '{"Lipid profile"}', 'completed', '2026-05-20 08:00:00+05:30', 399, '2026-05-20 08:00:00+05:30'),
  ('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '{"HbA1c","CBC"}', 'completed', '2026-04-18 08:00:00+05:30', 598, '2026-04-18 08:00:00+05:30'),
  ('00000000-0000-0000-0008-000000000004', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', '{"Thyroid profile T3/T4/TSH"}', 'sample_collected', now(), 449, now())
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 11. Pharmacy orders.
-- -----------------------------------------------------------------------
insert into public.pharmacy_orders (id, consumer_id, patient_id, prescription_id, pharmacy_id, delivery_address_id, items, status, total_price, created_at) values
  ('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0001-000000000014', '00000000-0000-0000-0003-000000000001',
    '[{"name":"Paracetamol syrup 250mg","qty":1,"in_stock":true,"price":78},{"name":"Cetirizine syrup 5mg","qty":1,"in_stock":true,"price":62},{"name":"ORS sachets","qty":5,"in_stock":true,"price":35}]'::jsonb,
    'completed', 214, '2026-06-16 09:00:00+05:30'),
  ('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0001-000000000014', '00000000-0000-0000-0003-000000000002',
    '[{"name":"Metformin 500mg","qty":1,"in_stock":true,"price":180},{"name":"Telmisartan 40mg","qty":1,"in_stock":true,"price":306}]'::jsonb,
    'completed', 486, '2026-04-19 09:00:00+05:30')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 12. Ambulance requests.
-- -----------------------------------------------------------------------
insert into public.ambulance_requests (id, consumer_id, patient_init, type, reason, pickup_address_id, hospital, ambulance_partner_id, status, created_at) values
  ('00000000-0000-0000-000a-000000000001', '00000000-0000-0000-0001-000000000001', 'R.N.', 'BLS', 'Dialysis transfer', '00000000-0000-0000-0003-000000000002', 'Continental Hospitals, Gachibowli', '00000000-0000-0000-0001-000000000017', 'completed', '2026-06-10 07:00:00+05:30')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------
-- 13. Wallet transactions (drives wallets.balance via apply_wallet_transaction).
--     Descriptions/amounts match the prototype's transaction list, plus one
--     reconciling top-up so the final balance lands on the prototype's
--     displayed ₹2,350.
-- -----------------------------------------------------------------------
insert into public.wallet_transactions (profile_id, type, amount, method, description, status, created_at)
select * from (values
  ('00000000-0000-0000-0001-000000000001'::uuid, 'credit', 2797::numeric, 'razorpay', 'Wallet top-up (HDFC ••6712)', 'success', '2026-05-01 10:00:00+05:30'::timestamptz),
  ('00000000-0000-0000-0001-000000000001', 'debit', 899, 'wallet', 'Physiotherapy session', 'success', '2026-06-28 09:30:00+05:30'),
  ('00000000-0000-0000-0001-000000000001', 'credit', 150, 'promo', 'Cashback CARE150', 'success', '2026-06-28 10:00:00+05:30'),
  ('00000000-0000-0000-0001-000000000001', 'credit', 2000, 'razorpay', 'Wallet top-up (HDFC ••6712)', 'success', '2026-06-01 09:00:00+05:30'),
  ('00000000-0000-0000-0001-000000000001', 'debit', 1199, 'wallet', 'Pediatric visit', 'success', '2026-06-15 16:30:00+05:30'),
  ('00000000-0000-0000-0001-000000000001', 'debit', 499, 'card', 'Injection & IV drip (Visa ••4523)', 'success', '2026-06-02 09:30:00+05:30')
) as v(profile_id, type, amount, method, description, status, created_at)
where not exists (
  select 1 from public.wallet_transactions where profile_id = '00000000-0000-0000-0001-000000000001'
);

-- -----------------------------------------------------------------------
-- 14. Payout methods + records for a couple of professionals.
-- -----------------------------------------------------------------------
insert into public.payout_methods (id, professional_id, method, details, is_default) values
  ('00000000-0000-0000-000b-000000000001', '00000000-0000-0000-0001-000000000008', 'bank', '{"account_holder":"Priya Sharma","account_number":"50100221234567","ifsc":"HDFC0001234"}'::jsonb, true),
  ('00000000-0000-0000-000b-000000000002', '00000000-0000-0000-0001-000000000009', 'upi', '{"upi_id":"kavya.krishnan@okhdfcbank"}'::jsonb, true)
on conflict (id) do nothing;

insert into public.payout_records (professional_id, payout_method_id, amount, status, paid_at, created_at)
select * from (values
  ('00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-000b-000000000001'::uuid, 8450::numeric, 'paid'::public.payout_status, '2026-06-30 18:00:00+05:30'::timestamptz, '2026-06-30 18:00:00+05:30'::timestamptz),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-000b-000000000001', 11200, 'paid', '2026-06-23 18:00:00+05:30', '2026-06-23 18:00:00+05:30'),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-000b-000000000001', 6780, 'paid', '2026-06-16 18:00:00+05:30', '2026-06-16 18:00:00+05:30'),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-000b-000000000001', 9340, 'paid', '2026-06-09 18:00:00+05:30', '2026-06-09 18:00:00+05:30')
) as v(professional_id, payout_method_id, amount, status, paid_at, created_at)
where not exists (
  select 1 from public.payout_records where professional_id = '00000000-0000-0000-0001-000000000008'
);

-- -----------------------------------------------------------------------
-- 15. Headline rating/rating_count figures from the prototype's team
--     roster. These are written last because the recompute_rating_on_*
--     triggers above would otherwise overwrite them with averages computed
--     from only the handful of sample jobs seeded here.
-- -----------------------------------------------------------------------
update public.professional_profiles set rating = 4.9, rating_count = 9 where profile_id = '00000000-0000-0000-0001-000000000002'; -- Meera Krishnan (nurse)
update public.professional_profiles set rating = 4.9, rating_count = 128 where profile_id = '00000000-0000-0000-0001-000000000004'; -- Dr. Ananya Rao
update public.professional_profiles set rating = 4.8, rating_count = 74 where profile_id = '00000000-0000-0000-0001-000000000005'; -- Dr. Suresh Menon
update public.professional_profiles set rating = 5.0, rating_count = 52 where profile_id = '00000000-0000-0000-0001-000000000006'; -- Dr. Kavya Reddy
update public.professional_profiles set rating = 4.8, rating_count = 45 where profile_id = '00000000-0000-0000-0001-000000000007'; -- Dr. Vaibhav Shetty
update public.professional_profiles set rating = 4.8, rating_count = 1204 where profile_id = '00000000-0000-0000-0001-000000000008'; -- Priya Sharma
update public.professional_profiles set rating = 4.9, rating_count = 812 where profile_id = '00000000-0000-0000-0001-000000000009'; -- Kavya Krishnan
update public.professional_profiles set rating = 4.9, rating_count = 2130 where profile_id = '00000000-0000-0000-0001-000000000010'; -- Dr. Rajesh Reddy
update public.professional_profiles set rating = 4.7, rating_count = 356 where profile_id = '00000000-0000-0000-0001-000000000011'; -- Dr. Suresh Kumar
update public.professional_profiles set rating = 4.9, rating_count = 640 where profile_id = '00000000-0000-0000-0001-000000000012'; -- Meera Nair (physio)
update public.professional_profiles set rating = 4.6, rating_count = 210 where profile_id = '00000000-0000-0000-0001-000000000013'; -- Anjali Rao
update public.professional_profiles set rating = 4.8, rating_count = 340 where profile_id = '00000000-0000-0000-0001-000000000014'; -- Apollo Pharmacy Kondapur
update public.professional_profiles set rating = 4.6, rating_count = 118 where profile_id = '00000000-0000-0000-0001-000000000015'; -- MedPlus Jubilee Hills
update public.professional_profiles set rating = 4.9, rating_count = 980 where profile_id = '00000000-0000-0000-0001-000000000016'; -- Rapid Response Ambulance
update public.professional_profiles set rating = 4.7, rating_count = 505 where profile_id = '00000000-0000-0000-0001-000000000017'; -- Sanjeevani Ambulance Fleet

commit;
