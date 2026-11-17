-- MomCare AI — Supabase PostgreSQL Schema & Initial Seed
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'patient',
  full_name TEXT NOT NULL,
  age INTEGER,
  pregnancy_week INTEGER,
  lmp_date TEXT,
  expected_delivery_date TEXT,
  blood_group TEXT,
  medical_history TEXT,
  diet_preference TEXT NOT NULL DEFAULT 'vegetarian',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  hospital TEXT NOT NULL,
  consultation_fee INTEGER NOT NULL,
  rating TEXT NOT NULL,
  languages TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT NOT NULL,
  available_slots TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  consultation_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TEXT NOT NULL,
  due_time TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Once',
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_week INTEGER,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.postpartum_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  mood TEXT NOT NULL,
  sleep_hours TEXT NOT NULL,
  feeding_count INTEGER NOT NULL DEFAULT 0,
  pain_level INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date TEXT NOT NULL,
  glasses_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sample users, specialists, appointments, reminders, community posts, and postpartum logs
INSERT INTO public.users (uid, email, role, full_name, age, pregnancy_week, lmp_date, expected_delivery_date, blood_group, medical_history, diet_preference, is_active)
VALUES
  ('demo-patient-ananya', 'ananya.mehta@momcare.ai', 'patient', 'Ananya Mehta', 29, 24, '2026-06-01', '2027-03-08', 'O+', 'Mild gestational iron deficiency in week 16; taking prescribed prenatal iron and folic acid.', 'vegetarian', true),
  ('demo-patient-priya', 'priya.kapoor@momcare.ai', 'patient', 'Priya Kapoor', 32, 34, '2026-03-23', '2026-12-28', 'B+', 'No chronic conditions. Low-risk second pregnancy.', 'non-vegetarian', true),
  ('demo-admin-kavya', 'admin@momcare.ai', 'admin', 'Dr. Kavya Menon (Admin)', 36, NULL, NULL, NULL, 'A+', 'Clinical Operations Lead', 'vegetarian', true)
ON CONFLICT (uid) DO NOTHING;

INSERT INTO public.doctors (name, specialization, qualification, experience_years, hospital, consultation_fee, rating, languages, bio, image_url, available_slots, is_available)
SELECT * FROM (VALUES
  ('Dr. Ananya Sharma', 'Senior Obstetrician & Gynecologist', 'MBBS, MD (OB-GYN), FICOG', 14, 'Lotus Women & Maternity Care', 950, '4.9', 'English, Hindi', 'Specializes in high-risk obstetrics, gentle birth planning, gestational diabetes care, and trimester-by-trimester maternal wellness.', '/src/assets/images/doctor_female_obgyn_1794900597156.jpg', '["09:30 AM","11:00 AM","02:30 PM","05:00 PM"]', true),
  ('Dr. Daniel Brooks', 'Maternal-Fetal Medicine & Pediatrics', 'MD, FACOG, Fellowship in MFM', 12, 'Bloom Perinatal Institute', 1200, '4.9', 'English', 'Focuses on fetal anomaly screening, ultrasound diagnostics, twin pregnancies, and coordinated newborn transition care.', '/src/assets/images/doctor_male_pediatrician_1794900597643.jpg', '["10:00 AM","12:30 PM","03:00 PM","06:00 PM"]', true),
  ('Dr. Meera Deshmukh', 'Lactation & Postpartum Specialist', 'MBBS, DGO, IBCLC', 10, 'Nurturing Roots Maternity Clinic', 800, '4.8', 'English, Hindi, Marathi', 'Supports new mothers through fourth-trimester recovery, breastfeeding latch coaching, pelvic floor healing, and postpartum mood care.', 'initials:MD', '["09:00 AM","11:30 AM","04:00 PM","05:30 PM"]', true),
  ('Dr. Rohan Kulkarni', 'Prenatal Nutrition & Endocrinology', 'MBBS, MD (Internal Medicine), CDE', 11, 'Aura Maternal Wellness Center', 900, '4.8', 'English, Hindi, Kannada', 'Guides expectant mothers on gestational thyroid balance, iron-rich Indian meal planning, and safe blood sugar management.', 'initials:RK', '["10:30 AM","01:00 PM","03:30 PM","06:30 PM"]', true)
) AS v(name, specialization, qualification, experience_years, hospital, consultation_fee, rating, languages, bio, image_url, available_slots, is_available)
WHERE NOT EXISTS (SELECT 1 FROM public.doctors LIMIT 1);

INSERT INTO public.appointments (user_id, doctor_id, appointment_date, time_slot, consultation_type, reason, status, notes)
SELECT u.id, d.id, '2026-11-22', '11:00 AM', 'Video Consultation', 'Week 24 Glucose Screening & Fetal Movement Review', 'Confirmed', 'Bring recent hemoglobin and fasting blood sugar readings.'
FROM public.users u, public.doctors d
WHERE u.uid = 'demo-patient-ananya' AND d.name = 'Dr. Ananya Sharma'
AND NOT EXISTS (SELECT 1 FROM public.appointments LIMIT 1);

INSERT INTO public.reminders (user_id, title, category, due_date, due_time, frequency, notes, completed)
SELECT u.id, v.title, v.category, v.due_date, v.due_time, v.frequency, v.notes, v.completed
FROM public.users u, (VALUES
  ('Prenatal Folic Acid & Iron Tablet', 'Supplement', '2026-11-17', '08:30 AM', 'Daily', 'Take with vitamin C rich orange or lemon water; avoid tea/coffee for 1 hour.', false),
  ('Tdap Vaccination Window', 'Vaccination', '2026-12-10', '10:30 AM', 'Once', 'Recommended between 27 and 36 weeks to pass pertussis antibodies to baby.', false),
  ('Oral Glucose Tolerance Test (OGTT)', 'Prenatal Checkup', '2026-11-24', '09:00 AM', 'Once', 'Fast overnight for 8–10 hours before morning clinic lab draw.', false),
  ('Afternoon Hydration Check-in', 'Hydration', '2026-11-17', '03:00 PM', 'Daily', 'Target 8–10 glasses (2.5L) of water, coconut water, or buttermilk.', true)
) AS v(title, category, due_date, due_time, frequency, notes, completed)
WHERE u.uid = 'demo-patient-ananya'
AND NOT EXISTS (SELECT 1 FROM public.reminders LIMIT 1);

INSERT INTO public.community_posts (user_id, author_name, author_week, category, title, content, likes_count)
SELECT u.id, v.author_name, v.author_week, v.category, v.title, v.content, v.likes_count
FROM public.users u, (VALUES
  ('Ananya Mehta', 24, 'Nutrition Tip', 'Evening snack ideas that helped stabilize my iron & energy in Week 24', 'Pairing roasted makhana and soaked almonds with a small bowl of pomegranate and a squeeze of lemon made a big difference in my afternoon fatigue. Has anyone else tried ragi laddoos with jaggery?', 14),
  ('Priya Kapoor', 34, 'Experience', 'Third trimester sleep pillow positioning tips', 'Placing a firm pillow behind my back while sleeping on my left side stopped me from rolling flat onto my spine. Also elevating my ankles slightly reduced evening swelling.', 21),
  ('Ananya Mehta', 24, 'Question', 'Preparing questions for my 24-week glucose screening', 'I have my OGTT next week. What questions did you ask your OB-GYN about interpreting borderline numbers and meal timing?', 9)
) AS v(author_name, author_week, category, title, content, likes_count)
WHERE u.uid = CASE WHEN v.author_name = 'Priya Kapoor' THEN 'demo-patient-priya' ELSE 'demo-patient-ananya' END
AND NOT EXISTS (SELECT 1 FROM public.community_posts LIMIT 1);

-- Enable Row Level Security (RLS) and add open app policies so the MomCare AI backend
-- can read and write all 8 tables using either the publishable key or service role key.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postpartum_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MomCare full access" ON public.users;
CREATE POLICY "MomCare full access" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.doctors;
CREATE POLICY "MomCare full access" ON public.doctors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.appointments;
CREATE POLICY "MomCare full access" ON public.appointments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.reminders;
CREATE POLICY "MomCare full access" ON public.reminders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.community_posts;
CREATE POLICY "MomCare full access" ON public.community_posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.community_comments;
CREATE POLICY "MomCare full access" ON public.community_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.postpartum_logs;
CREATE POLICY "MomCare full access" ON public.postpartum_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "MomCare full access" ON public.hydration_logs;
CREATE POLICY "MomCare full access" ON public.hydration_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
