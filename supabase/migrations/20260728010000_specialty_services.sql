-- Adds real, bookable specialty services so a family can pick a specific
-- branch of medicine ("Cardiology", "Endocrinology", ...) instead of only a
-- generic "GP consultation" or "Senior specialist visit". Purely additive:
-- no schema change, no edits to existing rows.
--
-- Doctor rows cover the branches of medicine relevant to home/teleconsult
-- care. Anesthesiology was deliberately left out -- it's an operating-room
-- specialty, not something a home-care platform can meaningfully offer as a
-- house call. Pediatrics and general medicine are already covered by the
-- existing 'pediatric' category and the "GP consultation" row respectively,
-- so they're not duplicated here.
--
-- Nurse rows give clinical parity: where a specialty consult implies an
-- ongoing home-nursing need not already covered by the existing nurse
-- catalog (injections, wound dressing, vaccination, catheter care,
-- post-surgical care), a matching nurse service is added.

insert into public.services (category, name, description, price_from, duration_mins, is_express_eligible, sort_order) values
  -- Doctor specialty consultations
  ('doctor', 'Cardiology consultation',       'Heart & blood pressure specialist',        1499.00, 40, false, 20),
  ('doctor', 'Orthopedics consultation',      'Bone, joint & sports injury specialist',   1499.00, 40, false, 21),
  ('doctor', 'Gynecology consultation',       'Women''s health & pregnancy care',         1499.00, 40, false, 22),
  ('doctor', 'Nephrology consultation',       'Kidney & dialysis specialist',             1799.00, 40, false, 23),
  ('doctor', 'Neurology consultation',        'Brain, nerve & stroke specialist',         1799.00, 40, false, 24),
  ('doctor', 'Gastroenterology consultation', 'Digestive & liver specialist',             1499.00, 40, false, 25),
  ('doctor', 'Pulmonology consultation',      'Lungs & breathing specialist',              1499.00, 40, false, 26),
  ('doctor', 'ENT consultation',              'Ear, nose & throat specialist',            1299.00, 30, false, 27),
  ('doctor', 'Oncology consultation',         'Cancer care & treatment planning',         2499.00, 45, false, 28),
  ('doctor', 'Urology consultation',          'Urinary & male reproductive specialist',   1499.00, 40, false, 29),
  ('doctor', 'Ophthalmology consultation',    'Eye care specialist',                      1299.00, 30, false, 30),
  ('doctor', 'Hematology consultation',       'Blood disorder specialist',                1799.00, 40, false, 31),
  ('doctor', 'Dermatology consultation',      'Skin, hair & nail specialist',              1299.00, 30, false, 32),
  ('doctor', 'Endocrinology consultation',    'Diabetes & hormone specialist',            1499.00, 40, false, 33),
  ('doctor', 'Rheumatology consultation',     'Autoimmune & joint pain specialist',       1499.00, 40, false, 34),
  ('doctor', 'General Surgery consultation',  'Pre/post-surgical evaluation',             1799.00, 40, false, 35),
  ('doctor', 'Psychiatry consultation',       'Mental health & counselling',               1499.00, 45, false, 36),
  ('doctor', 'Dentistry consultation',        'Dental check-up & minor procedures',        999.00, 30, false, 37),

  -- Matching nurse services for ongoing home-care needs not already covered
  -- by the existing nurse catalog (injections, wound dressing, vaccination,
  -- catheter care, post-surgical care)
  ('nurse', 'Cardiac care nurse',             'BP & ECG monitoring, post-cardiac home care', 899.00, 45, false, 20),
  ('nurse', 'Diabetes care nurse',            'Glucose monitoring & insulin administration', 699.00, 30, false, 21),
  ('nurse', 'Newborn & child care nurse',     'Newborn care & pediatric home nursing',       899.00, 60, false, 22),
  ('nurse', 'Oxygen & respiratory care nurse','Oxygen support & breathing assistance',       999.00, 45, false, 23),
  ('nurse', 'Palliative & cancer care nurse', 'Comfort-focused home nursing during treatment', 1299.00, 60, false, 24),
  ('nurse', 'Dialysis support nurse',         'Pre/post-dialysis home monitoring',            999.00, 45, false, 25),
  ('nurse', 'Neuro & stroke care nurse',      'Post-stroke home nursing support',             999.00, 45, false, 26),
  ('nurse', 'Mental health support nurse',    'Companion & wellbeing check-in visits',        799.00, 45, false, 27);
