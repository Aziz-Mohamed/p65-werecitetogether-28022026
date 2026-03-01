-- =============================================================================
-- WeReciteTogether — Development Seed Data
-- =============================================================================
-- This file seeds test data for LOCAL DEVELOPMENT ONLY.
-- It runs during `supabase db reset` and is NEVER applied to production.
--
-- Dev Accounts (all use password: devpass123):
--   dev-student@werecitetogether.test      (student)
--   dev-student2@werecitetogether.test     (student)
--   dev-student3@werecitetogether.test     (student)
--   dev-student4@werecitetogether.test     (student)
--   dev-student5@werecitetogether.test     (student)
--   dev-teacher@werecitetogether.test      (teacher)
--   dev-teacher2@werecitetogether.test     (teacher)
--   dev-teacher3@werecitetogether.test     (teacher)
--   dev-supervisor@werecitetogether.test   (supervisor)
--   dev-supervisor2@werecitetogether.test  (supervisor)
--   dev-padmin@werecitetogether.test       (program_admin)
--   dev-padmin2@werecitetogether.test      (program_admin)
--   dev-madmin@werecitetogether.test       (master_admin)
--
-- UUID Convention:
--   b1XXXXXX = student, b2XXXXXX = teacher, b3XXXXXX = supervisor,
--   b4XXXXXX = program_admin, b5XXXXXX = master_admin
--   c1XXXXXX = cohorts, d1XXXXXX = sessions
-- =============================================================================


-- =============================================================================
-- Section 1: Auth Users + Identities
-- =============================================================================
-- The handle_new_user() trigger auto-creates a profile row with role='student'
-- for each new auth.users insert. We update profiles in Section 2.

DO $$
DECLARE
  v_pw TEXT;
BEGIN
  v_pw := crypt('devpass123', gen_salt('bf'));

  -- ─── Students ──────────────────────────────────────────────────────────────

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('b1000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-student@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmad Al-Rashidi"}', now(), now(), '', '', '', ''),
    ('b1000002-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-student2@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Bint Khalid"}', now(), now(), '', '', '', ''),
    ('b1000003-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-student3@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Omar Hassan"}', now(), now(), '', '', '', ''),
    ('b1000004-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-student4@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Mahmoud"}', now(), now(), '', '', '', ''),
    ('b1000005-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-student5@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Yusuf Al-Bakri"}', now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    ('b1000001-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', '{"sub":"b1000001-0000-0000-0000-000000000000","email":"dev-student@werecitetogether.test"}', 'email', 'b1000001-0000-0000-0000-000000000000', now(), now(), now()),
    ('b1000002-0000-0000-0000-000000000000', 'b1000002-0000-0000-0000-000000000000', '{"sub":"b1000002-0000-0000-0000-000000000000","email":"dev-student2@werecitetogether.test"}', 'email', 'b1000002-0000-0000-0000-000000000000', now(), now(), now()),
    ('b1000003-0000-0000-0000-000000000000', 'b1000003-0000-0000-0000-000000000000', '{"sub":"b1000003-0000-0000-0000-000000000000","email":"dev-student3@werecitetogether.test"}', 'email', 'b1000003-0000-0000-0000-000000000000', now(), now(), now()),
    ('b1000004-0000-0000-0000-000000000000', 'b1000004-0000-0000-0000-000000000000', '{"sub":"b1000004-0000-0000-0000-000000000000","email":"dev-student4@werecitetogether.test"}', 'email', 'b1000004-0000-0000-0000-000000000000', now(), now(), now()),
    ('b1000005-0000-0000-0000-000000000000', 'b1000005-0000-0000-0000-000000000000', '{"sub":"b1000005-0000-0000-0000-000000000000","email":"dev-student5@werecitetogether.test"}', 'email', 'b1000005-0000-0000-0000-000000000000', now(), now(), now());

  -- ─── Teachers ──────────────────────────────────────────────────────────────

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('b2000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-teacher@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sheikh Ibrahim Noor"}', now(), now(), '', '', '', ''),
    ('b2000002-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-teacher2@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ustadha Maryam Qasim"}', now(), now(), '', '', '', ''),
    ('b2000003-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-teacher3@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sheikh Hassan Al-Azhari"}', now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    ('b2000001-0000-0000-0000-000000000000', 'b2000001-0000-0000-0000-000000000000', '{"sub":"b2000001-0000-0000-0000-000000000000","email":"dev-teacher@werecitetogether.test"}', 'email', 'b2000001-0000-0000-0000-000000000000', now(), now(), now()),
    ('b2000002-0000-0000-0000-000000000000', 'b2000002-0000-0000-0000-000000000000', '{"sub":"b2000002-0000-0000-0000-000000000000","email":"dev-teacher2@werecitetogether.test"}', 'email', 'b2000002-0000-0000-0000-000000000000', now(), now(), now()),
    ('b2000003-0000-0000-0000-000000000000', 'b2000003-0000-0000-0000-000000000000', '{"sub":"b2000003-0000-0000-0000-000000000000","email":"dev-teacher3@werecitetogether.test"}', 'email', 'b2000003-0000-0000-0000-000000000000', now(), now(), now());

  -- ─── Supervisors ───────────────────────────────────────────────────────────

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('b3000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-supervisor@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Abdullah Farooq"}', now(), now(), '', '', '', ''),
    ('b3000002-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-supervisor2@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ustadh Khalid Siddiq"}', now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    ('b3000001-0000-0000-0000-000000000000', 'b3000001-0000-0000-0000-000000000000', '{"sub":"b3000001-0000-0000-0000-000000000000","email":"dev-supervisor@werecitetogether.test"}', 'email', 'b3000001-0000-0000-0000-000000000000', now(), now(), now()),
    ('b3000002-0000-0000-0000-000000000000', 'b3000002-0000-0000-0000-000000000000', '{"sub":"b3000002-0000-0000-0000-000000000000","email":"dev-supervisor2@werecitetogether.test"}', 'email', 'b3000002-0000-0000-0000-000000000000', now(), now(), now());

  -- ─── Program Admins ────────────────────────────────────────────────────────

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('b4000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-padmin@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nadia Al-Haddad"}', now(), now(), '', '', '', ''),
    ('b4000002-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-padmin2@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tariq Mahmoud"}', now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    ('b4000001-0000-0000-0000-000000000000', 'b4000001-0000-0000-0000-000000000000', '{"sub":"b4000001-0000-0000-0000-000000000000","email":"dev-padmin@werecitetogether.test"}', 'email', 'b4000001-0000-0000-0000-000000000000', now(), now(), now()),
    ('b4000002-0000-0000-0000-000000000000', 'b4000002-0000-0000-0000-000000000000', '{"sub":"b4000002-0000-0000-0000-000000000000","email":"dev-padmin2@werecitetogether.test"}', 'email', 'b4000002-0000-0000-0000-000000000000', now(), now(), now());

  -- ─── Master Admin ──────────────────────────────────────────────────────────

  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('b5000001-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-madmin@werecitetogether.test', v_pw, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User"}', now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    ('b5000001-0000-0000-0000-000000000000', 'b5000001-0000-0000-0000-000000000000', '{"sub":"b5000001-0000-0000-0000-000000000000","email":"dev-madmin@werecitetogether.test"}', 'email', 'b5000001-0000-0000-0000-000000000000', now(), now(), now());

END;
$$;


-- =============================================================================
-- Section 2: Profile Updates
-- =============================================================================
-- The trigger created all profiles with role='student'. Now set correct roles,
-- names, demographics, and mark onboarding as complete.

-- Students
UPDATE profiles SET
  full_name = 'Ahmad Al-Rashidi', display_name = 'Ahmad',
  gender = 'male', age_range = '18_25', country = 'SA', languages = ARRAY['ar', 'en'],
  onboarding_completed = true
WHERE id = 'b1000001-0000-0000-0000-000000000000';

UPDATE profiles SET
  full_name = 'Fatima Bint Khalid', display_name = 'Fatima',
  gender = 'female', age_range = '18_25', country = 'AE', languages = ARRAY['ar'],
  onboarding_completed = true
WHERE id = 'b1000002-0000-0000-0000-000000000000';

UPDATE profiles SET
  full_name = 'Omar Hassan', display_name = 'Omar',
  gender = 'male', age_range = '26_35', country = 'EG', languages = ARRAY['ar', 'en'],
  onboarding_completed = true
WHERE id = 'b1000003-0000-0000-0000-000000000000';

UPDATE profiles SET
  full_name = 'Aisha Mahmoud', display_name = 'Aisha',
  gender = 'female', age_range = '26_35', country = 'JO', languages = ARRAY['ar'],
  onboarding_completed = true
WHERE id = 'b1000004-0000-0000-0000-000000000000';

UPDATE profiles SET
  full_name = 'Yusuf Al-Bakri', display_name = 'Yusuf',
  gender = 'male', age_range = '18_25', country = 'MA', languages = ARRAY['ar', 'fr'],
  onboarding_completed = true
WHERE id = 'b1000005-0000-0000-0000-000000000000';

-- Teachers
UPDATE profiles SET
  role = 'teacher',
  full_name = 'Sheikh Ibrahim Noor', display_name = 'Sh. Ibrahim',
  gender = 'male', age_range = '36_50', country = 'EG', languages = ARRAY['ar', 'en'],
  meeting_link = 'https://meet.google.com/dev-teacher-1', meeting_platform = 'google_meet',
  bio = 'Experienced Quran teacher specializing in free recitation sessions.',
  onboarding_completed = true
WHERE id = 'b2000001-0000-0000-0000-000000000000';

UPDATE profiles SET
  role = 'teacher',
  full_name = 'Ustadha Maryam Qasim', display_name = 'Ust. Maryam',
  gender = 'female', age_range = '26_35', country = 'SA', languages = ARRAY['ar', 'en'],
  meeting_link = 'https://meet.google.com/dev-teacher-2', meeting_platform = 'google_meet',
  bio = 'Hafidha with ijazah in Hafs. Teaches memorization and tajweed.',
  onboarding_completed = true
WHERE id = 'b2000002-0000-0000-0000-000000000000';

UPDATE profiles SET
  role = 'teacher',
  full_name = 'Sheikh Hassan Al-Azhari', display_name = 'Sh. Hassan',
  gender = 'male', age_range = '36_50', country = 'EG', languages = ARRAY['ar', 'en', 'fr'],
  meeting_link = 'https://meet.google.com/dev-teacher-3', meeting_platform = 'google_meet',
  bio = 'Al-Azhar graduate teaching weekend intensives and new Muslim programs.',
  onboarding_completed = true
WHERE id = 'b2000003-0000-0000-0000-000000000000';

-- Supervisors
UPDATE profiles SET
  role = 'supervisor',
  full_name = 'Dr. Abdullah Farooq', display_name = 'Dr. Abdullah',
  gender = 'male', age_range = '50_plus', country = 'SA', languages = ARRAY['ar', 'en'],
  bio = 'Academic supervisor overseeing memorization and tajweed programs.',
  onboarding_completed = true
WHERE id = 'b3000001-0000-0000-0000-000000000000';

UPDATE profiles SET
  role = 'supervisor',
  full_name = 'Ustadh Khalid Siddiq', display_name = 'Ust. Khalid',
  gender = 'male', age_range = '36_50', country = 'KW', languages = ARRAY['ar'],
  bio = 'Supervisor for weekend and mixed programs.',
  onboarding_completed = true
WHERE id = 'b3000002-0000-0000-0000-000000000000';

-- Program Admins
UPDATE profiles SET
  role = 'program_admin',
  full_name = 'Nadia Al-Haddad', display_name = 'Nadia',
  gender = 'female', age_range = '26_35', country = 'AE', languages = ARRAY['ar', 'en'],
  bio = 'Manages memorization, tajweed, and free recitation programs.',
  onboarding_completed = true
WHERE id = 'b4000001-0000-0000-0000-000000000000';

UPDATE profiles SET
  role = 'program_admin',
  full_name = 'Tariq Mahmoud', display_name = 'Tariq',
  gender = 'male', age_range = '26_35', country = 'EG', languages = ARRAY['ar', 'en'],
  bio = 'Manages weekend intensive and new Muslim programs.',
  onboarding_completed = true
WHERE id = 'b4000002-0000-0000-0000-000000000000';

-- Master Admin
UPDATE profiles SET
  role = 'master_admin',
  full_name = 'Admin User', display_name = 'Admin',
  gender = 'male', country = 'US', languages = ARRAY['en', 'ar'],
  onboarding_completed = true
WHERE id = 'b5000001-0000-0000-0000-000000000000';


-- =============================================================================
-- Section 3: Program Roles
-- =============================================================================
-- Assign staff to programs. master_admin has global access via is_master_admin().

INSERT INTO program_roles (profile_id, program_id, role) VALUES
  -- Sheikh Ibrahim: teaches free programs
  ('b2000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'teacher'),  -- Open Recitation
  ('b2000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004', 'teacher'),  -- Quran Review
  -- Ustadha Maryam: teaches structured programs
  ('b2000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'teacher'),  -- Quran Memorization
  ('b2000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'teacher'),  -- Tajweed Fundamentals
  -- Sheikh Hassan: teaches mixed/new muslim programs
  ('b2000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 'teacher'),  -- Weekend Intensive
  ('b2000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000007', 'teacher'),  -- New Muslim Program
  -- Dr. Abdullah: supervises structured programs
  ('b3000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'supervisor'),  -- Quran Memorization
  ('b3000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'supervisor'),  -- Tajweed Fundamentals
  -- Ustadh Khalid: supervises weekend programs
  ('b3000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 'supervisor'),  -- Weekend Intensive
  -- Nadia: admin for memorization, tajweed, and free recitation
  ('b4000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'program_admin'),  -- Open Recitation
  ('b4000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'program_admin'),  -- Quran Memorization
  ('b4000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 'program_admin'),  -- Tajweed Fundamentals
  -- Tariq: admin for weekend and new muslim programs
  ('b4000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 'program_admin'),  -- Weekend Intensive
  ('b4000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000007', 'program_admin');  -- New Muslim Program


-- =============================================================================
-- Section 4: Cohorts
-- =============================================================================
-- Track IDs are looked up via subquery since they're auto-generated in migration.

INSERT INTO cohorts (id, program_id, track_id, name, status, max_students, teacher_id, supervisor_id, start_date, end_date) VALUES
  -- Cohort 1: Juz 30 Memorization (in progress)
  ('c1000001-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Juz 30 Track'),
   'Juz 30 - Cohort A', 'in_progress', 15,
   'b2000002-0000-0000-0000-000000000000',  -- Ustadha Maryam
   'b3000001-0000-0000-0000-000000000000',  -- Dr. Abdullah
   (CURRENT_DATE - interval '30 days')::date,
   (CURRENT_DATE + interval '150 days')::date),

  -- Cohort 2: Beginner Tajweed (enrollment open)
  ('c1000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000003',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000003' AND name = 'Beginner Tajweed'),
   'Beginner Tajweed - Cohort A', 'enrollment_open', 20,
   'b2000002-0000-0000-0000-000000000000',  -- Ustadha Maryam
   'b3000001-0000-0000-0000-000000000000',  -- Dr. Abdullah
   (CURRENT_DATE + interval '14 days')::date,
   (CURRENT_DATE + interval '104 days')::date),

  -- Cohort 3: Weekend Intensive Group 1 (in progress)
  ('c1000003-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000006',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000006' AND name = 'Structured Cohort'),
   'Weekend Group 1', 'in_progress', 12,
   'b2000003-0000-0000-0000-000000000000',  -- Sheikh Hassan
   'b3000002-0000-0000-0000-000000000000',  -- Ustadh Khalid
   (CURRENT_DATE - interval '14 days')::date,
   (CURRENT_DATE + interval '76 days')::date),

  -- Cohort 4: New Muslim Foundations (enrollment open)
  ('c1000004-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000007',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000007' AND name = 'Foundation Track'),
   'New Muslim Foundations', 'enrollment_open', 10,
   'b2000003-0000-0000-0000-000000000000',  -- Sheikh Hassan
   NULL,
   (CURRENT_DATE + interval '7 days')::date,
   (CURRENT_DATE + interval '97 days')::date);


-- =============================================================================
-- Section 5: Enrollments
-- =============================================================================
-- Each student is enrolled in ~2 programs for realistic dashboard data.

INSERT INTO enrollments (student_id, program_id, track_id, cohort_id, teacher_id, status, enrolled_at) VALUES
  -- Ahmad: Open Recitation (active, free) + Quran Memorization (active, cohort)
  ('b1000001-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000001',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000001' AND name = 'Default Track'),
   NULL,
   'b2000001-0000-0000-0000-000000000000',
   'active', now() - interval '21 days'),

  ('b1000001-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Juz 30 Track'),
   'c1000001-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'active', now() - interval '28 days'),

  -- Fatima: Quran Memorization (active, cohort) + Tajweed (pending enrollment)
  ('b1000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Juz 30 Track'),
   'c1000001-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'active', now() - interval '28 days'),

  ('b1000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000003',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000003' AND name = 'Beginner Tajweed'),
   'c1000002-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'pending', now() - interval '3 days'),

  -- Omar: Open Recitation (active, free) + Weekend Intensive (active, cohort)
  ('b1000003-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000001',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000001' AND name = 'Default Track'),
   NULL,
   'b2000001-0000-0000-0000-000000000000',
   'active', now() - interval '14 days'),

  ('b1000003-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000006',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000006' AND name = 'Structured Cohort'),
   'c1000003-0000-0000-0000-000000000000',
   'b2000003-0000-0000-0000-000000000000',
   'active', now() - interval '14 days'),

  -- Aisha: Tajweed (active, cohort) + New Muslim Program (active, cohort)
  ('b1000004-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000003',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000003' AND name = 'Beginner Tajweed'),
   'c1000002-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'active', now() - interval '5 days'),

  ('b1000004-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000007',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000007' AND name = 'Foundation Track'),
   'c1000004-0000-0000-0000-000000000000',
   'b2000003-0000-0000-0000-000000000000',
   'active', now() - interval '2 days'),

  -- Yusuf: Quran Review (active, free) + Quran Memorization (waitlisted)
  ('b1000005-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000004',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000004' AND name = 'Default Track'),
   NULL,
   'b2000001-0000-0000-0000-000000000000',
   'active', now() - interval '10 days'),

  ('b1000005-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Juz 30 Track'),
   'c1000001-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'waitlisted', now() - interval '7 days');


-- =============================================================================
-- Section 6: Teacher Availability (free programs)
-- =============================================================================

INSERT INTO teacher_availability (teacher_id, program_id, is_available, available_since, max_concurrent_students, current_session_count) VALUES
  ('b2000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', true,  now() - interval '1 hour', 2, 0),  -- Sheikh Ibrahim: available for Open Recitation
  ('b2000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004', true,  now() - interval '30 minutes', 1, 0),  -- Sheikh Ibrahim: available for Quran Review
  ('b2000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', false, NULL, 1, 0);  -- Sheikh Hassan: not available for Weekend Intensive open track


-- =============================================================================
-- Section 7: Sessions
-- =============================================================================

INSERT INTO sessions (id, teacher_id, program_id, cohort_id, status, started_at, completed_at, duration_minutes, notes) VALUES
  -- Session 1: Open Recitation with Sheikh Ibrahim (completed, 3 days ago)
  ('d1000001-0000-0000-0000-000000000000',
   'b2000001-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000001',
   NULL,
   'completed',
   now() - interval '3 days',
   now() - interval '3 days' + interval '25 minutes',
   25,
   'Good session. Both students showed improvement.'),

  -- Session 2: Open Recitation with Sheikh Ibrahim (completed, 2 days ago)
  ('d1000002-0000-0000-0000-000000000000',
   'b2000001-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000001',
   NULL,
   'completed',
   now() - interval '2 days',
   now() - interval '2 days' + interval '20 minutes',
   20,
   'Quick review session with Ahmad.'),

  -- Session 3: Quran Memorization cohort with Ustadha Maryam (completed, 5 days ago)
  ('d1000003-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   'c1000001-0000-0000-0000-000000000000',
   'completed',
   now() - interval '5 days',
   now() - interval '5 days' + interval '45 minutes',
   45,
   'Covered new portion. Students progressing well through Juz 30.'),

  -- Session 4: Quran Memorization cohort with Ustadha Maryam (completed, 3 days ago)
  ('d1000004-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   'c1000001-0000-0000-0000-000000000000',
   'completed',
   now() - interval '3 days',
   now() - interval '3 days' + interval '40 minutes',
   40,
   'Review of previous memorization and new assignment.'),

  -- Session 5: Weekend Intensive with Sheikh Hassan (completed, last weekend)
  ('d1000005-0000-0000-0000-000000000000',
   'b2000003-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000006',
   'c1000003-0000-0000-0000-000000000000',
   'completed',
   now() - interval '2 days',
   now() - interval '2 days' + interval '60 minutes',
   60,
   'Intensive review session covering Surah Al-Mulk.'),

  -- Session 6: Quran Memorization draft (upcoming)
  ('d1000006-0000-0000-0000-000000000000',
   'b2000002-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   'c1000001-0000-0000-0000-000000000000',
   'draft',
   now(),
   NULL,
   NULL,
   NULL);


-- =============================================================================
-- Section 8: Session Attendance
-- =============================================================================

INSERT INTO session_attendance (session_id, student_id, score, notes) VALUES
  -- Session 1 (Open Recitation): Ahmad + Omar
  ('d1000001-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 4, 'Good recitation of Surah Al-Fatiha'),
  ('d1000001-0000-0000-0000-000000000000', 'b1000003-0000-0000-0000-000000000000', 3, 'Needs work on makhaarij al-huroof'),
  -- Session 2 (Open Recitation): Ahmad
  ('d1000002-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 5, 'Excellent progress on Surah Al-Ikhlas'),
  -- Session 3 (Memorization): Ahmad + Fatima
  ('d1000003-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 4, 'Memorized first 5 ayaat of Surah An-Naba well'),
  ('d1000003-0000-0000-0000-000000000000', 'b1000002-0000-0000-0000-000000000000', 5, 'Flawless memorization and tajweed'),
  -- Session 4 (Memorization): Ahmad + Fatima
  ('d1000004-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 3, 'Struggled with longer ayaat — needs more review'),
  ('d1000004-0000-0000-0000-000000000000', 'b1000002-0000-0000-0000-000000000000', 4, 'Minor tajweed errors on idghaam rules'),
  -- Session 5 (Weekend): Omar
  ('d1000005-0000-0000-0000-000000000000', 'b1000003-0000-0000-0000-000000000000', 4, 'Good recitation of Surah Al-Mulk');


-- =============================================================================
-- Section 9: Teacher Reviews
-- =============================================================================
-- The recalculate_teacher_rating_stats trigger auto-updates teacher_rating_stats.

INSERT INTO teacher_reviews (teacher_id, student_id, session_id, program_id, rating, tags, comment) VALUES
  ('b2000001-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 'd1000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   5, ARRAY['patient', 'clear_explanation', 'encouraging'], 'Very patient and encouraging teacher'),
  ('b2000001-0000-0000-0000-000000000000', 'b1000003-0000-0000-0000-000000000000', 'd1000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   4, ARRAY['good_pace', 'encouraging'], 'Good session overall'),
  ('b2000002-0000-0000-0000-000000000000', 'b1000001-0000-0000-0000-000000000000', 'd1000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002',
   5, ARRAY['excellent_tajweed', 'well_prepared'], 'Excellent teacher with deep knowledge'),
  ('b2000002-0000-0000-0000-000000000000', 'b1000002-0000-0000-0000-000000000000', 'd1000004-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002',
   4, ARRAY['patient', 'good_pace'], 'Very helpful and supportive');


-- =============================================================================
-- Section 10: Free Program Queue
-- =============================================================================

INSERT INTO free_program_queue (student_id, program_id, position, status, expires_at) VALUES
  ('b1000005-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 1, 'waiting', now() + interval '2 hours'),
  ('b1000004-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 2, 'waiting', now() + interval '2 hours');


-- =============================================================================
-- Section 11: Session Schedules
-- =============================================================================
-- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

INSERT INTO session_schedules (cohort_id, program_id, day_of_week, start_time, end_time) VALUES
  -- Juz 30 Cohort A: Mon + Wed evenings
  ('c1000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 1, '18:00', '19:00'),
  ('c1000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 3, '18:00', '19:00'),
  -- Beginner Tajweed: Tue evening
  ('c1000002-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003', 2, '19:00', '20:00'),
  -- Weekend Group 1: Fri + Sat mornings
  ('c1000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 5, '10:00', '12:00'),
  ('c1000003-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006', 6, '10:00', '12:00');


-- =============================================================================
-- Section 12: Program Waitlist
-- =============================================================================

INSERT INTO program_waitlist (student_id, program_id, track_id, cohort_id, position, status) VALUES
  ('b1000005-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000002',
   (SELECT id FROM program_tracks WHERE program_id = 'a1000000-0000-0000-0000-000000000002' AND name = 'Juz 30 Track'),
   'c1000001-0000-0000-0000-000000000000',
   1, 'waiting');


-- =============================================================================
-- Section 13: Daily Session Count
-- =============================================================================

INSERT INTO daily_session_count (student_id, program_id, date, session_count) VALUES
  ('b1000001-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', CURRENT_DATE, 1);


-- =============================================================================
-- Section 14: Notification Preferences
-- =============================================================================
-- Seed default preferences for the 5 primary login accounts.

INSERT INTO notification_preferences (profile_id, category, enabled) VALUES
  -- Ahmad (student): relevant student categories
  ('b1000001-0000-0000-0000-000000000000', 'enrollment', true),
  ('b1000001-0000-0000-0000-000000000000', 'session_reminder', true),
  ('b1000001-0000-0000-0000-000000000000', 'queue', true),
  ('b1000001-0000-0000-0000-000000000000', 'voice_memo', true),
  ('b1000001-0000-0000-0000-000000000000', 'waitlist', true),
  ('b1000001-0000-0000-0000-000000000000', 'general', true),
  -- Sheikh Ibrahim (teacher): relevant teacher categories
  ('b2000001-0000-0000-0000-000000000000', 'session_reminder', true),
  ('b2000001-0000-0000-0000-000000000000', 'queue', true),
  ('b2000001-0000-0000-0000-000000000000', 'rating', true),
  ('b2000001-0000-0000-0000-000000000000', 'cohort', true),
  ('b2000001-0000-0000-0000-000000000000', 'general', true),
  -- Dr. Abdullah (supervisor): relevant supervisor categories
  ('b3000001-0000-0000-0000-000000000000', 'quality_alert', true),
  ('b3000001-0000-0000-0000-000000000000', 'cohort', true),
  ('b3000001-0000-0000-0000-000000000000', 'general', true),
  -- Nadia (program_admin): admin categories
  ('b4000001-0000-0000-0000-000000000000', 'enrollment', true),
  ('b4000001-0000-0000-0000-000000000000', 'quality_alert', true),
  ('b4000001-0000-0000-0000-000000000000', 'cohort', true),
  ('b4000001-0000-0000-0000-000000000000', 'system', true),
  ('b4000001-0000-0000-0000-000000000000', 'general', true),
  -- Admin (master_admin): all categories
  ('b5000001-0000-0000-0000-000000000000', 'enrollment', true),
  ('b5000001-0000-0000-0000-000000000000', 'session_reminder', true),
  ('b5000001-0000-0000-0000-000000000000', 'queue', true),
  ('b5000001-0000-0000-0000-000000000000', 'rating', true),
  ('b5000001-0000-0000-0000-000000000000', 'voice_memo', true),
  ('b5000001-0000-0000-0000-000000000000', 'waitlist', true),
  ('b5000001-0000-0000-0000-000000000000', 'quality_alert', true),
  ('b5000001-0000-0000-0000-000000000000', 'cohort', true),
  ('b5000001-0000-0000-0000-000000000000', 'system', true),
  ('b5000001-0000-0000-0000-000000000000', 'general', true);
