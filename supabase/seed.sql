-- =============================================================================
-- Comprehensive Seed Data for WeReciteTogether
-- =============================================================================
-- This seed creates realistic test data covering every feature area.
-- All users use password: devtest123
-- =============================================================================

-- ─── Helper: Create auth user ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _seed_create_user(
  _email TEXT,
  _role TEXT,
  _full_name TEXT,
  _name_ar TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID := gen_random_uuid();
  _password_hash TEXT := extensions.crypt('devtest123', extensions.gen_salt('bf'));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = _email) THEN
    SELECT id INTO _user_id FROM auth.users WHERE email = _email;
    RETURN _user_id;
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    _user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', _email, _password_hash,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('role', _role, 'full_name', _full_name),
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    _user_id, _user_id, _email, 'email',
    jsonb_build_object('sub', _user_id::text, 'email', _email),
    now(), now(), now()
  );

  RETURN _user_id;
END;
$$;

-- =============================================================================
-- MAIN SEED BLOCK
-- =============================================================================

DO $$
DECLARE
  -- ── User IDs ──
  _student1 UUID;  _student2 UUID;  _student3 UUID;  _student4 UUID;
  _student5 UUID;  _student6 UUID;  _student7 UUID;  _student8 UUID;
  _teacher1 UUID;  _teacher2 UUID;  _teacher3 UUID;  _teacher4 UUID;
  _supervisor1 UUID;  _supervisor2 UUID;
  _pa1 UUID;  -- program admin
  _ma1 UUID;  -- master admin

  -- ── Infrastructure IDs ──
  _school_id UUID := gen_random_uuid();

  -- ── Program IDs (looked up from migrations) ──
  _prog1 UUID;  -- Alternating Recitation
  _prog2 UUID;  -- Children's Program
  _prog3 UUID;  -- Non-Arabic Speakers
  _prog5 UUID;  -- Mutoon Program
  _prog7 UUID;  -- Quran Memorization
  _prog8 UUID;  -- Himam Marathon

  -- ── Track IDs ──
  _track_p1_1 UUID;  _track_p1_2 UUID;
  _track_p2_1 UUID;  _track_p2_2 UUID;  _track_p2_3 UUID;
  _track_p5_2 UUID;
  _track_p7_1 UUID;  _track_p7_3 UUID;

  -- ── Class IDs ──
  _class_a UUID := gen_random_uuid();
  _class_b UUID := gen_random_uuid();
  _class_c UUID := gen_random_uuid();
  _class_d UUID := gen_random_uuid();
  _class_e UUID := gen_random_uuid();
  _class_f UUID := gen_random_uuid();

  -- ── Session IDs (for FK references) ──
  _sess1 UUID := gen_random_uuid();
  _sess2 UUID := gen_random_uuid();
  _sess3 UUID := gen_random_uuid();
  _sess4 UUID := gen_random_uuid();
  _sess5 UUID := gen_random_uuid();
  _sess6 UUID := gen_random_uuid();
  _sess7 UUID := gen_random_uuid();
  _sess8 UUID := gen_random_uuid();
  _sess9 UUID := gen_random_uuid();
  _sess10 UUID := gen_random_uuid();
  _sess11 UUID := gen_random_uuid();
  _sess12 UUID := gen_random_uuid();
  _sess13 UUID := gen_random_uuid();
  _sess14 UUID := gen_random_uuid();
  _sess15 UUID := gen_random_uuid();
  _sess16 UUID := gen_random_uuid();
  _sess17 UUID := gen_random_uuid();
  _sess18 UUID := gen_random_uuid();
  _sess19 UUID := gen_random_uuid();
  _sess20 UUID := gen_random_uuid();
  _sess21 UUID := gen_random_uuid();
  _sess22 UUID := gen_random_uuid();
  _sess23 UUID := gen_random_uuid();
  _sess24 UUID := gen_random_uuid();
  _sess25 UUID := gen_random_uuid();

  -- ── Himam IDs ──
  _himam_event1 UUID := gen_random_uuid();
  _himam_event2 UUID := gen_random_uuid();
  _himam_reg1 UUID := gen_random_uuid();
  _himam_reg2 UUID := gen_random_uuid();
  _himam_reg3 UUID := gen_random_uuid();
  _himam_reg4 UUID := gen_random_uuid();

  -- ── Certification IDs ──
  _cert1 UUID := gen_random_uuid();
  _cert2 UUID := gen_random_uuid();
  _cert3 UUID := gen_random_uuid();

  -- ── Sticker IDs ──
  _sticker1 TEXT := 'star_gold';
  _sticker2 TEXT := 'star_silver';
  _sticker3 TEXT := 'crescent_bronze';
  _sticker4 TEXT := 'book_diamond';
  _sticker5 TEXT := 'lamp_gold';
  _sticker6 TEXT := 'quran_seasonal';

BEGIN
  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 1: Users (16 total — 8 students, 4 teachers, 2 supervisors, 1 PA, 1 MA)
  -- ════════════════════════════════════════════════════════════════════════════

  _student1    := _seed_create_user('dev-student@test.werecitetogether.app',       'student',       'Ahmad Al-Farsi');
  _student2    := _seed_create_user('dev-student2@test.werecitetogether.app',      'student',       'Yusuf Ibrahim');
  _student3    := _seed_create_user('dev-student3@test.werecitetogether.app',      'student',       'Fatima Al-Rashid');
  _student4    := _seed_create_user('dev-student4@test.werecitetogether.app',      'student',       'Omar Hassan');
  _student5    := _seed_create_user('dev-student5@test.werecitetogether.app',      'student',       'Aisha Kareem');
  _student6    := _seed_create_user('dev-student6@test.werecitetogether.app',      'student',       'Khalid Al-Mansour');
  _student7    := _seed_create_user('dev-student7@test.werecitetogether.app',      'student',       'Maryam Noor');
  _student8    := _seed_create_user('dev-student8@test.werecitetogether.app',      'student',       'Hassan Tariq');

  _teacher1    := _seed_create_user('dev-teacher@test.werecitetogether.app',       'teacher',       'Sheikh Abdullah');
  _teacher2    := _seed_create_user('dev-teacher2@test.werecitetogether.app',      'teacher',       'Ustadh Bilal');
  _teacher3    := _seed_create_user('dev-teacher3@test.werecitetogether.app',      'teacher',       'Sheikh Hamza');
  _teacher4    := _seed_create_user('dev-teacher4@test.werecitetogether.app',      'teacher',       'Ustadha Salma');

  _supervisor1 := _seed_create_user('dev-supervisor@test.werecitetogether.app',    'supervisor',    'Dr. Nasser Al-Qadi');
  _supervisor2 := _seed_create_user('dev-supervisor2@test.werecitetogether.app',   'supervisor',    'Dr. Layla Farouk');

  _pa1         := _seed_create_user('dev-program-admin@test.werecitetogether.app', 'program_admin', 'Admin Sami');
  _ma1         := _seed_create_user('dev-master-admin@test.werecitetogether.app',  'master_admin',  'Admin Rashid');

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 2: School
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO schools (id, name, slug, timezone, latitude, longitude, geofence_radius_meters)
  VALUES (_school_id, 'Dev Test School', 'dev-test-school', 'Asia/Riyadh', 24.7136, 46.6753, 500)
  ON CONFLICT (slug) DO UPDATE SET id = schools.id
  RETURNING id INTO _school_id;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 3: Profile updates (onboarding, localization, meeting links)
  -- ════════════════════════════════════════════════════════════════════════════

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "أحمد الفارسي", "en": "Ahmad Al-Farsi"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student1;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "يوسف إبراهيم", "en": "Yusuf Ibrahim"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student2;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "فاطمة الراشد", "en": "Fatima Al-Rashid"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student3;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "عمر حسن", "en": "Omar Hassan"}'::jsonb,
    preferred_language = 'en'
  WHERE id = _student4;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "عائشة كريم", "en": "Aisha Kareem"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student5;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "خالد المنصور", "en": "Khalid Al-Mansour"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student6;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "مريم نور", "en": "Maryam Noor"}'::jsonb,
    preferred_language = 'en'
  WHERE id = _student7;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "حسن طارق", "en": "Hassan Tariq"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _student8;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "الشيخ عبدالله", "en": "Sheikh Abdullah"}'::jsonb,
    meeting_link = 'https://meet.google.com/dev-teacher-1',
    meeting_platform = 'google_meet',
    preferred_language = 'ar'
  WHERE id = _teacher1;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "الأستاذ بلال", "en": "Ustadh Bilal"}'::jsonb,
    meeting_link = 'https://zoom.us/j/dev-teacher-2',
    meeting_platform = 'zoom',
    preferred_language = 'ar'
  WHERE id = _teacher2;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "الشيخ حمزة", "en": "Sheikh Hamza"}'::jsonb,
    meeting_link = 'https://meet.google.com/dev-teacher-3',
    meeting_platform = 'google_meet',
    preferred_language = 'ar'
  WHERE id = _teacher3;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "الأستاذة سلمى", "en": "Ustadha Salma"}'::jsonb,
    meeting_link = 'https://zoom.us/j/dev-teacher-4',
    meeting_platform = 'zoom',
    preferred_language = 'ar'
  WHERE id = _teacher4;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "د. ناصر القاضي", "en": "Dr. Nasser Al-Qadi"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _supervisor1;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "د. ليلى فاروق", "en": "Dr. Layla Farouk"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _supervisor2;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "المشرف سامي", "en": "Admin Sami"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _pa1;

  UPDATE profiles SET
    onboarding_completed = true,
    school_id = _school_id,
    name_localized = '{"ar": "المدير راشد", "en": "Admin Rashid"}'::jsonb,
    preferred_language = 'ar'
  WHERE id = _ma1;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 4: Student records (with streaks and levels)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO students (id, school_id, enrollment_date, current_level, current_streak, longest_streak)
  VALUES
    (_student1, _school_id, CURRENT_DATE - 90,  5, 12, 30),
    (_student2, _school_id, CURRENT_DATE - 60,  3,  7, 14),
    (_student3, _school_id, CURRENT_DATE - 120, 7, 25, 45),
    (_student4, _school_id, CURRENT_DATE - 30,  1,  3,  5),
    (_student5, _school_id, CURRENT_DATE - 45,  2,  0,  8),
    (_student6, _school_id, CURRENT_DATE - 200, 9, 42, 60),
    (_student7, _school_id, CURRENT_DATE - 15,  0,  2,  2),
    (_student8, _school_id, CURRENT_DATE - 75,  4,  5, 20)
  ON CONFLICT (id) DO UPDATE SET
    current_level = EXCLUDED.current_level,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 5: Look up program & track IDs from migrations
  -- ════════════════════════════════════════════════════════════════════════════

  SELECT id INTO _prog1 FROM programs WHERE sort_order = 1; -- Alternating Recitation
  SELECT id INTO _prog2 FROM programs WHERE sort_order = 2; -- Children's Program
  SELECT id INTO _prog3 FROM programs WHERE sort_order = 3; -- Non-Arabic Speakers
  SELECT id INTO _prog5 FROM programs WHERE sort_order = 5; -- Mutoon Program
  SELECT id INTO _prog7 FROM programs WHERE sort_order = 7; -- Quran Memorization
  SELECT id INTO _prog8 FROM programs WHERE sort_order = 8; -- Himam Marathon

  IF _prog1 IS NULL THEN
    RAISE NOTICE 'Seed: programs not found, skipping';
    RETURN;
  END IF;

  -- Tracks for Alternating Recitation
  SELECT id INTO _track_p1_1 FROM program_tracks WHERE program_id = _prog1 AND sort_order = 1;
  SELECT id INTO _track_p1_2 FROM program_tracks WHERE program_id = _prog1 AND sort_order = 2;

  -- Tracks for Children's Program
  SELECT id INTO _track_p2_1 FROM program_tracks WHERE program_id = _prog2 AND sort_order = 1;
  SELECT id INTO _track_p2_2 FROM program_tracks WHERE program_id = _prog2 AND sort_order = 2;
  SELECT id INTO _track_p2_3 FROM program_tracks WHERE program_id = _prog2 AND sort_order = 3;

  -- Track for Mutoon
  SELECT id INTO _track_p5_2 FROM program_tracks WHERE program_id = _prog5 AND sort_order = 2;

  -- Tracks for Quran Memorization
  SELECT id INTO _track_p7_1 FROM program_tracks WHERE program_id = _prog7 AND sort_order = 1;
  SELECT id INTO _track_p7_3 FROM program_tracks WHERE program_id = _prog7 AND sort_order = 3;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 6: Program roles (staff assignments)
  -- ════════════════════════════════════════════════════════════════════════════

  -- Program admin on multiple programs
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by) VALUES
    (_pa1, _prog1, 'program_admin', _ma1),
    (_pa1, _prog2, 'program_admin', _ma1),
    (_pa1, _prog5, 'program_admin', _ma1),
    (_pa1, _prog7, 'program_admin', _ma1),
    (_pa1, _prog8, 'program_admin', _ma1)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- Supervisors
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by) VALUES
    (_supervisor1, _prog1, 'supervisor', _pa1),
    (_supervisor1, _prog7, 'supervisor', _pa1),
    (_supervisor2, _prog2, 'supervisor', _pa1),
    (_supervisor2, _prog5, 'supervisor', _pa1)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- Teachers (with supervisor linkage)
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by, supervisor_id) VALUES
    (_teacher1, _prog1, 'teacher', _pa1, _supervisor1),
    (_teacher1, _prog7, 'teacher', _pa1, _supervisor1),
    (_teacher2, _prog1, 'teacher', _pa1, _supervisor1),
    (_teacher3, _prog2, 'teacher', _pa1, _supervisor2),
    (_teacher4, _prog2, 'teacher', _pa1, _supervisor2),
    (_teacher4, _prog5, 'teacher', _pa1, _supervisor2)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 7: Classes (6 classes across programs)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO classes (id, school_id, name, teacher_id, max_students, is_active, program_id, track_id, status, supervisor_id, start_date, meeting_link) VALUES
    -- Alternating Recitation classes
    (_class_a, _school_id, 'Morning Circle A',  _teacher1, 10, true, _prog1, _track_p1_1, 'in_progress',     _supervisor1, CURRENT_DATE - 30, 'https://meet.google.com/class-a'),
    (_class_b, _school_id, 'Evening Circle B',  _teacher2, 8,  true, _prog1, _track_p1_2, 'in_progress',     _supervisor1, CURRENT_DATE - 20, 'https://meet.google.com/class-b'),
    -- Children's Program classes
    (_class_c, _school_id, 'Talqeen Group 1',   _teacher3, 12, true, _prog2, _track_p2_1, 'in_progress',     _supervisor2, CURRENT_DATE - 60, 'https://zoom.us/j/class-c'),
    (_class_d, _school_id, 'Nooraniah Group',   _teacher4, 10, true, _prog2, _track_p2_2, 'enrollment_open', _supervisor2, CURRENT_DATE - 10, 'https://zoom.us/j/class-d'),
    -- Quran Memorization class
    (_class_e, _school_id, 'Mateen 10 - Batch 1', _teacher1, 6, true, _prog7, _track_p7_1, 'in_progress',   _supervisor1, CURRENT_DATE - 45, 'https://meet.google.com/class-e'),
    -- Mutoon class
    (_class_f, _school_id, 'Tuhfat Al-Atfal A', _teacher4, 8, true, _prog5, _track_p5_2, 'enrollment_open', _supervisor2, CURRENT_DATE - 5,  'https://zoom.us/j/class-f')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 8: Enrollments (students in programs/classes)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO enrollments (student_id, program_id, track_id, class_id, teacher_id, status, enrolled_at) VALUES
    -- Alternating Recitation — Morning Circle A (Teacher 1)
    (_student1, _prog1, _track_p1_1, _class_a, _teacher1, 'active',    now() - INTERVAL '80 days'),
    (_student2, _prog1, _track_p1_1, _class_a, _teacher1, 'active',    now() - INTERVAL '55 days'),
    (_student3, _prog1, _track_p1_1, _class_a, _teacher1, 'active',    now() - INTERVAL '100 days'),
    (_student6, _prog1, _track_p1_1, _class_a, _teacher1, 'active',    now() - INTERVAL '180 days'),
    -- Alternating Recitation — Evening Circle B (Teacher 2)
    (_student4, _prog1, _track_p1_2, _class_b, _teacher2, 'active',    now() - INTERVAL '18 days'),
    (_student5, _prog1, _track_p1_2, _class_b, _teacher2, 'active',    now() - INTERVAL '40 days'),
    (_student8, _prog1, _track_p1_2, _class_b, _teacher2, 'active',    now() - INTERVAL '65 days'),
    -- Children's Program — Talqeen (Teacher 3)
    (_student7, _prog2, _track_p2_1, _class_c, _teacher3, 'active',    now() - INTERVAL '12 days'),
    -- Children's Program — Nooraniah (Teacher 4) — one waitlisted
    (_student5, _prog2, _track_p2_2, _class_d, _teacher4, 'active',    now() - INTERVAL '8 days'),
    -- Quran Memorization (Teacher 1)
    (_student3, _prog7, _track_p7_1, _class_e, _teacher1, 'active',    now() - INTERVAL '40 days'),
    (_student6, _prog7, _track_p7_1, _class_e, _teacher1, 'active',    now() - INTERVAL '40 days'),
    -- Mutoon (Teacher 4)
    (_student1, _prog5, _track_p5_2, _class_f, _teacher4, 'active',    now() - INTERVAL '3 days'),
    -- Completed enrollment
    (_student8, _prog2, _track_p2_3, NULL,     _teacher3, 'completed', now() - INTERVAL '200 days'),
    -- Dropped enrollment
    (_student4, _prog7, _track_p7_3, NULL,     _teacher1, 'dropped',   now() - INTERVAL '60 days')
  ON CONFLICT DO NOTHING;

  -- Update students.class_id to match their primary enrollment
  UPDATE students SET class_id = _class_a WHERE id IN (_student1, _student2, _student3, _student6);
  UPDATE students SET class_id = _class_b WHERE id IN (_student4, _student5, _student8);
  UPDATE students SET class_id = _class_c WHERE id = _student7;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 9: Waitlist
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO program_waitlist (student_id, program_id, class_id, track_id, position, status, created_at) VALUES
    (_student7, _prog2, _class_d, _track_p2_2, 1, 'waiting', now() - INTERVAL '2 days'),
    (_student8, _prog2, _class_d, _track_p2_2, 2, 'waiting', now() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- Disable triggers that call http functions (unavailable locally)
  -- ════════════════════════════════════════════════════════════════════════════
  ALTER TABLE sessions DISABLE TRIGGER on_session_insert;
  ALTER TABLE sessions DISABLE TRIGGER after_session_completed_daily_count;
  ALTER TABLE attendance DISABLE TRIGGER on_attendance_insert;
  ALTER TABLE teacher_ratings DISABLE TRIGGER after_rating_change;
  ALTER TABLE teacher_availability DISABLE TRIGGER on_teacher_available_queue;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 10: Sessions (25 sessions across multiple students/teachers)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO sessions (id, school_id, student_id, teacher_id, program_id, session_date, status, recitation_quality, tajweed_score, memorization_score, notes, created_at) VALUES
    -- Student 1 (Ahmad) — consistent performer with Teacher 1
    (_sess1,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE,                  'completed', 4, 4, 5, 'Excellent tajweed today',       now()),
    (_sess2,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '1 day', 'completed', 4, 5, 4, 'Strong memorization review',    now() - INTERVAL '1 day'),
    (_sess3,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '2 days','completed', 5, 5, 5, 'Perfect session mashaAllah',     now() - INTERVAL '2 days'),
    (_sess4,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '4 days','completed', 3, 4, 4, 'Needs to review Surah Mulk',    now() - INTERVAL '4 days'),
    (_sess5,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '7 days','completed', 4, 4, 4, 'Good progress on Juz 29',       now() - INTERVAL '7 days'),
    (_sess6,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '10 days','completed', 4, 3, 5, 'Tajweed rules need review',    now() - INTERVAL '10 days'),
    (_sess7,  _school_id, _student1, _teacher1, _prog1, CURRENT_DATE - INTERVAL '14 days','completed', 5, 4, 4, 'Consistent improvement',       now() - INTERVAL '14 days'),

    -- Student 2 (Yusuf) — moderate performer
    (_sess8,  _school_id, _student2, _teacher1, _prog1, CURRENT_DATE - INTERVAL '1 day', 'completed', 3, 3, 4, 'Working on idgham rules',       now() - INTERVAL '1 day'),
    (_sess9,  _school_id, _student2, _teacher1, _prog1, CURRENT_DATE - INTERVAL '3 days','completed', 4, 4, 3, 'Good tajweed improvement',      now() - INTERVAL '3 days'),
    (_sess10, _school_id, _student2, _teacher1, _prog1, CURRENT_DATE - INTERVAL '6 days','completed', 3, 3, 3, 'Review session',                now() - INTERVAL '6 days'),
    (_sess11, _school_id, _student2, _teacher1, _prog1, CURRENT_DATE - INTERVAL '9 days','completed', 4, 4, 4, 'Solid memorization',            now() - INTERVAL '9 days'),

    -- Student 3 (Fatima) — top performer
    (_sess12, _school_id, _student3, _teacher1, _prog1, CURRENT_DATE,                    'completed', 5, 5, 5, 'Flawless recitation',           now()),
    (_sess13, _school_id, _student3, _teacher1, _prog1, CURRENT_DATE - INTERVAL '2 days','completed', 5, 4, 5, 'Nearly perfect',                now() - INTERVAL '2 days'),
    (_sess14, _school_id, _student3, _teacher1, _prog1, CURRENT_DATE - INTERVAL '5 days','completed', 4, 5, 5, 'Great tajweed mastery',         now() - INTERVAL '5 days'),
    (_sess15, _school_id, _student3, _teacher1, _prog7, CURRENT_DATE - INTERVAL '1 day', 'completed', 5, 5, 5, 'Completed Juz 5 memorization',  now() - INTERVAL '1 day'),
    (_sess16, _school_id, _student3, _teacher1, _prog7, CURRENT_DATE - INTERVAL '4 days','completed', 4, 5, 4, 'Review of Juz 3-4',            now() - INTERVAL '4 days'),

    -- Student 4 (Omar) — beginner with Teacher 2
    (_sess17, _school_id, _student4, _teacher2, _prog1, CURRENT_DATE - INTERVAL '1 day', 'completed', 2, 2, 3, 'Learning basic makhaarij',      now() - INTERVAL '1 day'),
    (_sess18, _school_id, _student4, _teacher2, _prog1, CURRENT_DATE - INTERVAL '5 days','completed', 2, 3, 2, 'Practicing letter pronunciation', now() - INTERVAL '5 days'),

    -- Student 5 (Aisha) — with Teacher 2
    (_sess19, _school_id, _student5, _teacher2, _prog1, CURRENT_DATE - INTERVAL '2 days','completed', 3, 4, 3, 'Good understanding of rules',   now() - INTERVAL '2 days'),
    (_sess20, _school_id, _student5, _teacher2, _prog1, CURRENT_DATE - INTERVAL '8 days','completed', 3, 3, 4, 'Memorization progressing',      now() - INTERVAL '8 days'),

    -- Student 6 (Khalid) — veteran, high scores
    (_sess21, _school_id, _student6, _teacher1, _prog1, CURRENT_DATE,                    'completed', 5, 5, 5, 'Mastered Surah Yasin',          now()),
    (_sess22, _school_id, _student6, _teacher1, _prog7, CURRENT_DATE - INTERVAL '1 day', 'completed', 5, 5, 4, 'Juz 8 complete',                now() - INTERVAL '1 day'),

    -- Student 7 (Maryam) — new student, Children's program
    (_sess23, _school_id, _student7, _teacher3, _prog2, CURRENT_DATE - INTERVAL '1 day', 'completed', 3, 3, 3, 'First session - promising',     now() - INTERVAL '1 day'),

    -- Student 8 (Hassan) — with Teacher 2
    (_sess24, _school_id, _student8, _teacher2, _prog1, CURRENT_DATE - INTERVAL '3 days','completed', 4, 3, 4, 'Surah An-Naba review',          now() - INTERVAL '3 days'),

    -- Draft session (not yet completed)
    (_sess25, _school_id, _student1, _teacher1, _prog1, CURRENT_DATE,                    'draft',     NULL, NULL, NULL, 'Session in progress',    now());

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 11: Attendance records
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO attendance (school_id, student_id, class_id, date, status) VALUES
    -- Student 1 — mostly present
    (_school_id, _student1, _class_a, CURRENT_DATE,                    'present'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '1 day', 'present'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '2 days','present'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '3 days','late'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '4 days','present'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '7 days','present'),
    (_school_id, _student1, _class_a, CURRENT_DATE - INTERVAL '8 days','absent'),

    -- Student 2
    (_school_id, _student2, _class_a, CURRENT_DATE - INTERVAL '1 day', 'present'),
    (_school_id, _student2, _class_a, CURRENT_DATE - INTERVAL '3 days','present'),
    (_school_id, _student2, _class_a, CURRENT_DATE - INTERVAL '6 days','excused'),
    (_school_id, _student2, _class_a, CURRENT_DATE - INTERVAL '9 days','present'),

    -- Student 3
    (_school_id, _student3, _class_a, CURRENT_DATE,                    'present'),
    (_school_id, _student3, _class_a, CURRENT_DATE - INTERVAL '2 days','present'),
    (_school_id, _student3, _class_a, CURRENT_DATE - INTERVAL '5 days','present'),

    -- Student 4
    (_school_id, _student4, _class_b, CURRENT_DATE - INTERVAL '1 day', 'present'),
    (_school_id, _student4, _class_b, CURRENT_DATE - INTERVAL '5 days','absent'),

    -- Student 6
    (_school_id, _student6, _class_a, CURRENT_DATE,                    'present'),
    (_school_id, _student6, _class_a, CURRENT_DATE - INTERVAL '1 day', 'present'),

    -- Student 7
    (_school_id, _student7, _class_c, CURRENT_DATE - INTERVAL '1 day', 'present')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 12: Stickers & student awards
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO stickers (id, name_ar, name_en, tier, image_path, program_id) VALUES
    (_sticker1, 'نجمة ذهبية',   'Gold Star',        'gold',     'stickers/star_gold.png',      NULL),
    (_sticker2, 'نجمة فضية',    'Silver Star',       'silver',   'stickers/star_silver.png',    NULL),
    (_sticker3, 'هلال برونزي',   'Bronze Crescent',   'bronze',   'stickers/crescent_bronze.png', NULL),
    (_sticker4, 'كتاب ماسي',    'Diamond Book',      'diamond',  'stickers/book_diamond.png',   NULL),
    (_sticker5, 'مصباح ذهبي',   'Gold Lamp',         'gold',     'stickers/lamp_gold.png',      _prog1),
    (_sticker6, 'مصحف موسمي',   'Seasonal Quran',    'seasonal', 'stickers/quran_seasonal.png', _prog1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO student_stickers (student_id, sticker_id, awarded_by, awarded_at, reason, is_new) VALUES
    -- Student 1 (Ahmad) — multiple stickers
    (_student1, _sticker1, _teacher1, now() - INTERVAL '1 day',  'Perfect recitation',          false),
    (_student1, _sticker2, _teacher1, now() - INTERVAL '5 days', 'Good attendance streak',      false),
    (_student1, _sticker5, _teacher1, now() - INTERVAL '10 days','First week completed',        false),
    (_student1, _sticker1, _teacher1, now(),                      'Excellent tajweed mastery',   true),

    -- Student 3 (Fatima) — top student, many stickers
    (_student3, _sticker1, _teacher1, now(),                      'Flawless recitation',         true),
    (_student3, _sticker4, _teacher1, now() - INTERVAL '3 days', 'Completed Juz 5',             false),
    (_student3, _sticker1, _teacher1, now() - INTERVAL '7 days', 'Outstanding progress',        false),
    (_student3, _sticker6, _teacher1, now() - INTERVAL '14 days','Ramadan special achievement', false),

    -- Student 6 (Khalid) — veteran
    (_student6, _sticker4, _teacher1, now() - INTERVAL '2 days', 'Mastered Surah Yasin',        true),
    (_student6, _sticker1, _teacher1, now() - INTERVAL '20 days','100-day streak',              false),
    (_student6, _sticker5, _teacher1, now() - INTERVAL '50 days','Consistent performer',        false),

    -- Student 2 (Yusuf)
    (_student2, _sticker2, _teacher1, now() - INTERVAL '2 days', 'Good effort',                 true),
    (_student2, _sticker3, _teacher1, now() - INTERVAL '8 days', 'Improved tajweed',            false),

    -- Student 7 (Maryam)
    (_student7, _sticker3, _teacher3, now() - INTERVAL '1 day',  'Welcome sticker',             true);

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 13: Student badges
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO student_badges (student_id, badge_id, program_id, earned_at) VALUES
    -- Student 1 — 30-day member + 7-day streak
    (_student1, 'enrollment_30d', _prog1, now() - INTERVAL '60 days'),
    (_student1, 'enrollment_90d', _prog1, now()),
    (_student1, 'streak_7d',      _prog1, now() - INTERVAL '20 days'),

    -- Student 3 — advanced
    (_student3, 'enrollment_30d', _prog1, now() - INTERVAL '90 days'),
    (_student3, 'enrollment_90d', _prog1, now() - INTERVAL '30 days'),
    (_student3, 'sessions_10',    _prog1, now() - INTERVAL '30 days'),
    (_student3, 'streak_7d',      _prog1, now() - INTERVAL '60 days'),
    (_student3, 'streak_30d',     _prog1, now() - INTERVAL '10 days'),

    -- Student 6 — veteran
    (_student6, 'enrollment_30d', _prog1, now() - INTERVAL '170 days'),
    (_student6, 'enrollment_90d', _prog1, now() - INTERVAL '110 days'),
    (_student6, 'sessions_10',    _prog1, now() - INTERVAL '120 days'),
    (_student6, 'sessions_50',    _prog1, now() - INTERVAL '50 days'),
    (_student6, 'streak_7d',      _prog1, now() - INTERVAL '150 days'),
    (_student6, 'streak_30d',     _prog1, now() - INTERVAL '80 days'),

    -- Student 2
    (_student2, 'enrollment_30d', _prog1, now() - INTERVAL '30 days'),
    (_student2, 'streak_7d',      _prog1, now() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 14: Teacher availability (green dot system)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO teacher_availability (teacher_id, program_id, is_available, available_since, max_students, active_student_count) VALUES
    (_teacher1, _prog1, true,  now() - INTERVAL '30 minutes', 3, 1),
    (_teacher2, _prog1, true,  now() - INTERVAL '15 minutes', 2, 0),
    (_teacher3, _prog2, false, NULL,                           2, 0),
    (_teacher4, _prog2, true,  now() - INTERVAL '1 hour',     1, 0)
  ON CONFLICT (teacher_id, program_id) DO UPDATE SET
    is_available = EXCLUDED.is_available,
    available_since = EXCLUDED.available_since,
    active_student_count = EXCLUDED.active_student_count;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 15: Teacher ratings & stats
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO teacher_ratings (session_id, student_id, teacher_id, program_id, star_rating, tags, comment, is_flagged) VALUES
    -- Teacher 1 ratings (mostly positive)
    (_sess1,  _student1, _teacher1, _prog1, 5, ARRAY['patient','knowledgeable'],    'Very helpful and patient',             false),
    (_sess3,  _student1, _teacher1, _prog1, 5, ARRAY['encouraging'],               'Best session so far',                  false),
    (_sess5,  _student1, _teacher1, _prog1, 4, ARRAY['knowledgeable'],              'Good session',                         false),
    (_sess8,  _student2, _teacher1, _prog1, 4, ARRAY['patient'],                    'Takes time to explain',                false),
    (_sess9,  _student2, _teacher1, _prog1, 3, ARRAY['structured'],                 'Okay session',                         false),
    (_sess12, _student3, _teacher1, _prog1, 5, ARRAY['knowledgeable','encouraging'],'Amazing teacher mashaAllah',           false),
    (_sess14, _student3, _teacher1, _prog1, 5, ARRAY['patient','structured'],       'Excellent methodology',                false),
    (_sess21, _student6, _teacher1, _prog1, 5, ARRAY['knowledgeable','inspiring'],  'One of the best teachers',             false),

    -- Teacher 2 ratings (mixed)
    (_sess17, _student4, _teacher2, _prog1, 2, ARRAY['rushed'],                     'Session felt rushed',                  true),
    (_sess19, _student5, _teacher2, _prog1, 4, ARRAY['patient'],                    'Good explanation of rules',            false),
    (_sess20, _student5, _teacher2, _prog1, 3, ARRAY['structured'],                 'Average session',                      false),
    (_sess24, _student8, _teacher2, _prog1, 4, ARRAY['encouraging'],                'Helped me understand the ayah better', false),

    -- Teacher 3 ratings
    (_sess23, _student7, _teacher3, _prog2, 4, ARRAY['patient','kid_friendly'],     'Great with children',                  false)
  ON CONFLICT DO NOTHING;

  -- Teacher rating stats (aggregated)
  INSERT INTO teacher_rating_stats (teacher_id, program_id, average_rating, total_reviews, star_distribution, common_positive_tags, trend_direction, last_30_days_avg, prior_30_days_avg) VALUES
    (_teacher1, _prog1, 4.50, 8, '{"1":0,"2":0,"3":1,"4":2,"5":5}', ARRAY['knowledgeable','patient','encouraging'], 'stable',    4.60, 4.40),
    (_teacher2, _prog1, 3.25, 4, '{"1":0,"2":1,"3":1,"4":2,"5":0}', ARRAY['patient','encouraging'],                 'improving', 3.50, 3.00),
    (_teacher3, _prog2, 4.00, 1, '{"1":0,"2":0,"3":0,"4":1,"5":0}', ARRAY['patient','kid_friendly'],                'stable',    4.00, 0)
  ON CONFLICT (teacher_id, program_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    star_distribution = EXCLUDED.star_distribution;

  -- Rating exclusion log (supervisor excluded one harsh rating)
  INSERT INTO rating_exclusion_log (rating_id, action, performed_by, reason)
  SELECT tr.id, 'excluded', _supervisor1, 'Student had a bad day, not representative of teacher quality'
  FROM teacher_ratings tr
  WHERE tr.session_id = _sess17 AND tr.student_id = _student4
  LIMIT 1;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 16: Certifications (various stages)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO certifications (id, student_id, teacher_id, program_id, track_id, type, status, title, title_ar, notes, chain_of_narration, certificate_number, issued_by, reviewed_by, issue_date, metadata) VALUES
    -- Issued ijazah (Student 6 — veteran)
    (_cert1, _student6, _teacher1, _prog1, _track_p1_1, 'ijazah', 'issued',
     'Ijazah in Quran Recitation',
     'إجازة في تلاوة القرآن الكريم',
     'Student has demonstrated mastery of tajweed rules and can recite with precision.',
     'Sanad through Sheikh Abdullah → Sheikh Ahmad → ...',
     'WRT-2026-0001',
     _supervisor1, _supervisor1, now() - INTERVAL '30 days',
     '{"surah_count": 114, "juz_count": 30}'::jsonb),

    -- Supervisor approved (Student 3 — awaiting issuance)
    (_cert2, _student3, _teacher1, _prog7, _track_p7_1, 'completion', 'supervisor_approved',
     'Completion of Mateen 10 Juz',
     'إتمام متين ١٠ أجزاء',
     'Completed memorization of 10 juz with excellent review scores.',
     NULL,
     NULL,
     NULL, _supervisor1, NULL,
     '{"juz_completed": 10}'::jsonb),

    -- Recommended (Student 1 — pending supervisor review)
    (_cert3, _student1, _teacher1, _prog1, _track_p1_1, 'graduation', 'recommended',
     'Graduation from Alternating Recitation',
     'تخرّج من برنامج التسميع بالتناوب',
     'Student has shown consistent progress and is ready to graduate.',
     NULL,
     NULL,
     NULL, NULL, NULL,
     '{}'::jsonb);

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 17: Himam Events (Quranic marathon)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO himam_events (id, program_id, event_date, start_time, end_time, registration_deadline, status, created_by) VALUES
    -- Upcoming event (next Friday)
    (_himam_event1, _prog8,
     CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE)::int + 7)::int % 7,
     '05:00', '23:00',
     (CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE)::int + 7)::int % 7 - 1)::timestamptz,
     'upcoming', _pa1),
    -- Completed event (last week)
    (_himam_event2, _prog8,
     CURRENT_DATE - 7,
     '05:00', '23:00',
     (CURRENT_DATE - 8)::timestamptz,
     'completed', _pa1)
  ON CONFLICT DO NOTHING;

  -- Registrations for upcoming event
  INSERT INTO himam_registrations (id, event_id, student_id, track, selected_juz, time_slots, status) VALUES
    (_himam_reg1, _himam_event1, _student1, '3_juz',  ARRAY[28,29,30],
     '[{"start":"08:00","end":"10:00"},{"start":"14:00","end":"16:00"},{"start":"20:00","end":"22:00"}]'::jsonb,
     'registered'),
    (_himam_reg2, _himam_event1, _student3, '5_juz',  ARRAY[26,27,28,29,30],
     '[{"start":"06:00","end":"09:00"},{"start":"13:00","end":"16:00"},{"start":"19:00","end":"22:00"}]'::jsonb,
     'registered')
  ON CONFLICT DO NOTHING;

  -- Registrations for completed event
  INSERT INTO himam_registrations (id, event_id, student_id, track, selected_juz, partner_id, time_slots, status) VALUES
    (_himam_reg3, _himam_event2, _student6, '10_juz', ARRAY[21,22,23,24,25,26,27,28,29,30], NULL,
     '[{"start":"05:00","end":"09:00"},{"start":"11:00","end":"15:00"},{"start":"17:00","end":"21:00"}]'::jsonb,
     'completed'),
    (_himam_reg4, _himam_event2, _student2, '3_juz',  ARRAY[28,29,30], NULL,
     '[{"start":"08:00","end":"10:00"},{"start":"15:00","end":"17:00"},{"start":"20:00","end":"22:00"}]'::jsonb,
     'incomplete')
  ON CONFLICT DO NOTHING;

  -- Progress for completed event — Student 6 completed all 10 juz
  INSERT INTO himam_progress (registration_id, juz_number, status, completed_at, completed_by) VALUES
    (_himam_reg3, 21, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '2 hours',  _teacher1),
    (_himam_reg3, 22, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '3 hours',  _teacher1),
    (_himam_reg3, 23, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '4 hours',  _teacher2),
    (_himam_reg3, 24, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '6 hours',  _teacher2),
    (_himam_reg3, 25, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '7 hours',  _teacher1),
    (_himam_reg3, 26, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '9 hours',  _teacher1),
    (_himam_reg3, 27, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '10 hours', _teacher2),
    (_himam_reg3, 28, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '12 hours', _teacher2),
    (_himam_reg3, 29, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '14 hours', _teacher1),
    (_himam_reg3, 30, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '16 hours', _teacher1)
  ON CONFLICT DO NOTHING;

  -- Progress for incomplete — Student 2 only got 2 of 3
  INSERT INTO himam_progress (registration_id, juz_number, status, completed_at, completed_by) VALUES
    (_himam_reg4, 28, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '3 hours',  _teacher2),
    (_himam_reg4, 29, 'completed', (CURRENT_DATE - 7)::timestamptz + INTERVAL '6 hours',  _teacher2),
    (_himam_reg4, 30, 'pending',   NULL,                                                    NULL)
  ON CONFLICT DO NOTHING;

  -- Progress rows for upcoming event registrations (all pending)
  INSERT INTO himam_progress (registration_id, juz_number, status) VALUES
    (_himam_reg1, 28, 'pending'), (_himam_reg1, 29, 'pending'), (_himam_reg1, 30, 'pending'),
    (_himam_reg2, 26, 'pending'), (_himam_reg2, 27, 'pending'), (_himam_reg2, 28, 'pending'),
    (_himam_reg2, 29, 'pending'), (_himam_reg2, 30, 'pending')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 18: Memorization progress & recitations
  -- ════════════════════════════════════════════════════════════════════════════

  -- Memorization progress
  INSERT INTO memorization_progress (school_id, student_id, surah_number, from_ayah, to_ayah, status, last_reviewed_at) VALUES
    -- Student 1 — multiple surahs
    (_school_id, _student1, 67,  1, 30,  'memorized',    now() - INTERVAL '5 days'),
    (_school_id, _student1, 78,  1, 40,  'memorized',    now() - INTERVAL '10 days'),
    (_school_id, _student1, 36,  1, 83,  'learning',     now() - INTERVAL '2 days'),
    (_school_id, _student1, 55,  1, 78,  'needs_review', now() - INTERVAL '30 days'),

    -- Student 3 — advanced
    (_school_id, _student3, 67,  1, 30,  'memorized',    now() - INTERVAL '20 days'),
    (_school_id, _student3, 36,  1, 83,  'memorized',    now() - INTERVAL '10 days'),
    (_school_id, _student3, 18,  1, 110, 'memorized',    now() - INTERVAL '5 days'),
    (_school_id, _student3, 56,  1, 96,  'memorized',    now() - INTERVAL '15 days'),
    (_school_id, _student3, 2,   1, 286, 'learning',     now() - INTERVAL '1 day'),

    -- Student 6 — veteran
    (_school_id, _student6, 67,  1, 30,  'memorized',    now() - INTERVAL '100 days'),
    (_school_id, _student6, 36,  1, 83,  'memorized',    now()),
    (_school_id, _student6, 2,   1, 286, 'memorized',    now() - INTERVAL '30 days'),
    (_school_id, _student6, 3,   1, 200, 'memorized',    now() - INTERVAL '20 days'),
    (_school_id, _student6, 4,   1, 176, 'learning',     now() - INTERVAL '2 days'),

    -- Student 4 — beginner
    (_school_id, _student4, 112, 1, 4,   'memorized',    now() - INTERVAL '3 days'),
    (_school_id, _student4, 113, 1, 5,   'memorized',    now() - INTERVAL '2 days'),
    (_school_id, _student4, 114, 1, 6,   'learning',     now() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- Recitations (per-session surah records)
  INSERT INTO recitations (school_id, session_id, student_id, teacher_id, surah_number, from_ayah, to_ayah, recitation_type, accuracy_score, tajweed_score, fluency_score) VALUES
    (_school_id, _sess1,  _student1, _teacher1, 67,  1,  15, 'new_hifz',       5, 4, 5),
    (_school_id, _sess1,  _student1, _teacher1, 67,  16, 30, 'new_hifz',       4, 4, 4),
    (_school_id, _sess2,  _student1, _teacher1, 78,  1,  20, 'recent_review',  5, 5, 5),
    (_school_id, _sess3,  _student1, _teacher1, 36,  1,  30, 'new_hifz',       5, 5, 5),
    (_school_id, _sess12, _student3, _teacher1, 18,  1,  50, 'new_hifz',       5, 5, 5),
    (_school_id, _sess13, _student3, _teacher1, 18,  51, 110,'new_hifz',       5, 4, 5),
    (_school_id, _sess15, _student3, _teacher1, 2,   1,  30, 'new_hifz',       4, 4, 4),
    (_school_id, _sess21, _student6, _teacher1, 36,  1,  83, 'old_review',     5, 5, 5),
    (_school_id, _sess17, _student4, _teacher2, 112, 1,  4,  'new_hifz',       3, 3, 3),
    (_school_id, _sess23, _student7, _teacher3, 114, 1,  6,  'new_hifz',       4, 3, 4)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 19: Mutoon progress
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO mutoon_progress (student_id, program_id, track_id, current_line, total_lines, review_count, status, last_reviewed_at) VALUES
    (_student1, _prog5, _track_p5_2, 45, 120, 8,  'in_progress', now() - INTERVAL '2 days')
  ON CONFLICT (student_id, track_id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 20: Student guardians (Children's program)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO student_guardians (student_id, guardian_name, guardian_phone, guardian_email, relationship, is_primary, notes) VALUES
    (_student7, 'Ibrahim Noor',    '+966501234567', 'ibrahim.noor@example.com',  'parent',   true,  'Father — primary contact'),
    (_student7, 'Sara Noor',       '+966509876543', 'sara.noor@example.com',     'parent',   false, 'Mother'),
    (_student5, 'Mahmoud Kareem',  '+966507654321', 'mahmoud.kareem@example.com','parent',   true,  'Father — available after 4pm')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 21: Notification preferences
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO notification_preferences (user_id, sticker_awarded, trophy_earned, achievement_unlocked, attendance_marked, session_completed, daily_summary, student_alert, quiet_hours_enabled, quiet_hours_start, quiet_hours_end) VALUES
    (_student1,    true,  true,  true,  true,  true,  true,  false, true,  '22:00'::time, '06:00'::time),
    (_student3,    true,  true,  true,  true,  true,  false, false, false, NULL,           NULL),
    (_teacher1,    true,  true,  true,  true,  true,  true,  true,  true,  '23:00'::time, '05:00'::time),
    (_teacher2,    true,  true,  true,  false, true,  true,  true,  false, NULL,           NULL),
    (_supervisor1, false, false, false, false, false, true,  true,  true,  '21:00'::time, '07:00'::time)
  ON CONFLICT (user_id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 22: Platform config
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO platform_config (name, name_ar, description, default_meeting_platform)
  VALUES ('WeReciteTogether', 'نتلو معاً', 'Online Quran recitation platform', 'google_meet')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 23: Daily session counts (rate limiting tracker)
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO daily_session_counts (student_id, program_id, session_date, session_count) VALUES
    (_student1, _prog1, CURRENT_DATE,                    1),
    (_student1, _prog1, CURRENT_DATE - INTERVAL '1 day', 1),
    (_student1, _prog1, CURRENT_DATE - INTERVAL '2 days',1),
    (_student3, _prog1, CURRENT_DATE,                    1),
    (_student3, _prog7, CURRENT_DATE - INTERVAL '1 day', 1),
    (_student6, _prog1, CURRENT_DATE,                    1),
    (_student6, _prog7, CURRENT_DATE - INTERVAL '1 day', 1),
    (_student4, _prog1, CURRENT_DATE - INTERVAL '1 day', 1)
  ON CONFLICT (student_id, program_id, session_date) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 24: Teacher work schedules
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO teacher_work_schedules (school_id, teacher_id, day_of_week, start_time, end_time) VALUES
    -- Teacher 1: Sun-Thu mornings & evenings
    (_school_id, _teacher1, 0, '08:00', '12:00'),  -- Sunday
    (_school_id, _teacher1, 1, '08:00', '12:00'),  -- Monday
    (_school_id, _teacher1, 2, '08:00', '12:00'),  -- Tuesday
    (_school_id, _teacher1, 3, '08:00', '12:00'),  -- Wednesday
    (_school_id, _teacher1, 4, '08:00', '12:00'),  -- Thursday

    -- Teacher 2: Sun-Wed evenings
    (_school_id, _teacher2, 0, '16:00', '20:00'),
    (_school_id, _teacher2, 1, '16:00', '20:00'),
    (_school_id, _teacher2, 2, '16:00', '20:00'),
    (_school_id, _teacher2, 3, '16:00', '20:00'),

    -- Teacher 3: Sat-Wed mornings
    (_school_id, _teacher3, 6, '09:00', '13:00'),  -- Saturday
    (_school_id, _teacher3, 0, '09:00', '13:00'),
    (_school_id, _teacher3, 1, '09:00', '13:00'),
    (_school_id, _teacher3, 2, '09:00', '13:00'),
    (_school_id, _teacher3, 3, '09:00', '13:00'),

    -- Teacher 4: flexible
    (_school_id, _teacher4, 0, '10:00', '14:00'),
    (_school_id, _teacher4, 2, '10:00', '14:00'),
    (_school_id, _teacher4, 4, '10:00', '14:00')
  ON CONFLICT (teacher_id, day_of_week) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 25: Class schedules
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO class_schedules (school_id, class_id, day_of_week, start_time, end_time) VALUES
    -- Morning Circle A: Sun, Tue, Thu
    (_school_id, _class_a, 0, '08:30', '09:30'),
    (_school_id, _class_a, 2, '08:30', '09:30'),
    (_school_id, _class_a, 4, '08:30', '09:30'),

    -- Evening Circle B: Sun, Mon, Wed
    (_school_id, _class_b, 0, '17:00', '18:00'),
    (_school_id, _class_b, 1, '17:00', '18:00'),
    (_school_id, _class_b, 3, '17:00', '18:00'),

    -- Talqeen Group 1: Sat, Mon, Wed
    (_school_id, _class_c, 6, '09:30', '10:30'),
    (_school_id, _class_c, 1, '09:30', '10:30'),
    (_school_id, _class_c, 3, '09:30', '10:30'),

    -- Nooraniah Group: Sat, Tue, Thu
    (_school_id, _class_d, 6, '10:30', '11:30'),
    (_school_id, _class_d, 2, '10:30', '11:30'),
    (_school_id, _class_d, 4, '10:30', '11:30'),

    -- Mateen 10 Batch 1: Sun, Wed
    (_school_id, _class_e, 0, '09:00', '10:00'),
    (_school_id, _class_e, 3, '09:00', '10:00')
  ON CONFLICT (class_id, day_of_week, start_time) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SECTION 26: Memorization assignments
  -- ════════════════════════════════════════════════════════════════════════════

  INSERT INTO memorization_assignments (school_id, student_id, assigned_by, surah_number, from_ayah, to_ayah, assignment_type, due_date, status, notes) VALUES
    -- Student 1 active assignments
    (_school_id, _student1, _teacher1, 36, 31, 60,  'new_hifz',       CURRENT_DATE + 4,  'pending',    'Continue Ya-Sin memorization'),
    (_school_id, _student1, _teacher1, 55, 1,  30,  'recent_review',  CURRENT_DATE + 6,  'pending',    'Review Ar-Rahman first 30 ayat'),

    -- Student 3 assignments
    (_school_id, _student3, _teacher1, 2,  31, 60,  'new_hifz',       CURRENT_DATE + 5,  'pending',    'Al-Baqarah next section'),

    -- Student 4 beginner assignment
    (_school_id, _student4, _teacher2, 114, 1, 6,   'new_hifz',       CURRENT_DATE + 2,  'pending',    'Memorize Surah An-Nas'),

    -- Student 6 review assignment
    (_school_id, _student6, _teacher1, 4,  1,  50,  'old_review',     CURRENT_DATE + 2,  'pending',    'An-Nisa first 50 ayat'),

    -- Completed assignment
    (_school_id, _student3, _teacher1, 18, 1, 110,  'new_hifz',       CURRENT_DATE - 20, 'completed',  'Al-Kahf complete')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- Re-enable triggers
  -- ════════════════════════════════════════════════════════════════════════════
  ALTER TABLE sessions ENABLE TRIGGER on_session_insert;
  ALTER TABLE sessions ENABLE TRIGGER after_session_completed_daily_count;
  ALTER TABLE attendance ENABLE TRIGGER on_attendance_insert;
  ALTER TABLE teacher_ratings ENABLE TRIGGER after_rating_change;
  ALTER TABLE teacher_availability ENABLE TRIGGER on_teacher_available_queue;

  RAISE NOTICE 'Seed: comprehensive development data created successfully';
END
$$;

-- ── Cleanup helper function ──
DROP FUNCTION IF EXISTS _seed_create_user(TEXT, TEXT, TEXT, TEXT);
