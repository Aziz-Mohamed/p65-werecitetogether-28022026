-- Seed: Development test users (one per role)
-- These users are created for dev pill sign-in on the simulator.
-- The handle_new_profile trigger auto-creates profile rows.

-- Helper: Create test users using Supabase auth.users directly
-- Password: devtest123 (bcrypt hash)

DO $$
DECLARE
  _password_hash TEXT := crypt('devtest123', gen_salt('bf'));
  _roles TEXT[] := ARRAY['student', 'teacher', 'supervisor', 'program_admin', 'master_admin'];
  _names TEXT[] := ARRAY['Test Student', 'Test Teacher', 'Test Supervisor', 'Test Program Admin', 'Test Master Admin'];
  _slugs TEXT[] := ARRAY['student', 'teacher', 'supervisor', 'program-admin', 'master-admin'];
  _role TEXT;
  _name TEXT;
  _slug TEXT;
  _email TEXT;
  _user_id UUID;
BEGIN
  FOR i IN 1..array_length(_roles, 1) LOOP
    _role := _roles[i];
    _name := _names[i];
    _slug := _slugs[i];
    _email := 'dev-' || _slug || '@test.werecitetogether.app';

    -- Skip if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = _email) THEN
      _user_id := gen_random_uuid();

      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        _user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        _email,
        _password_hash,
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('role', _role, 'full_name', _name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      -- Create identity record for email provider
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        provider,
        identity_data,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        _user_id,
        _user_id,
        _email,
        'email',
        jsonb_build_object('sub', _user_id::text, 'email', _email),
        now(),
        now(),
        now()
      );
    END IF;
  END LOOP;
END
$$;

-- ─── Development Seed Data ─────────────────────────────────────────────────
-- Wire up test users with programs, roles, cohorts, enrollments, and sessions
-- so every role has data to display when logging in locally.

DO $$
DECLARE
  _student_id    UUID;
  _teacher_id    UUID;
  _supervisor_id UUID;
  _pa_id         UUID;  -- program admin
  _ma_id         UUID;  -- master admin
  _prog1_id      UUID;  -- Alternating Recitation
  _prog2_id      UUID;  -- Children's Program
  _track1_id     UUID;  -- first track of prog1
  _class_a_id    UUID := gen_random_uuid();
  _class_b_id    UUID := gen_random_uuid();
  _school_id     UUID := gen_random_uuid();
  _teacher_role_id UUID;
BEGIN
  -- ── Look up test user IDs ──────────────────────────────────────────────────
  SELECT id INTO _student_id    FROM auth.users WHERE email = 'dev-student@test.werecitetogether.app';
  SELECT id INTO _teacher_id    FROM auth.users WHERE email = 'dev-teacher@test.werecitetogether.app';
  SELECT id INTO _supervisor_id FROM auth.users WHERE email = 'dev-supervisor@test.werecitetogether.app';
  SELECT id INTO _pa_id         FROM auth.users WHERE email = 'dev-program-admin@test.werecitetogether.app';
  SELECT id INTO _ma_id         FROM auth.users WHERE email = 'dev-master-admin@test.werecitetogether.app';

  -- Bail out if users not found (seed already ran partially or users missing)
  IF _student_id IS NULL OR _teacher_id IS NULL THEN
    RAISE NOTICE 'Seed: test users not found, skipping data seeding';
    RETURN;
  END IF;

  -- ── Look up programs (created by migration 00005) ─────────────────────────
  SELECT id INTO _prog1_id FROM programs WHERE name = 'Alternating Recitation' LIMIT 1;
  SELECT id INTO _prog2_id FROM programs WHERE name = 'Children''s Program' LIMIT 1;

  IF _prog1_id IS NULL THEN
    RAISE NOTICE 'Seed: programs not found, skipping data seeding';
    RETURN;
  END IF;

  -- Grab first track for prog1
  SELECT id INTO _track1_id FROM program_tracks WHERE program_id = _prog1_id LIMIT 1;

  -- ── 1. Create a dev school (sessions require school_id) ───────────────────
  INSERT INTO schools (id, name, slug, timezone)
  VALUES (_school_id, 'Dev Test School', 'dev-test-school', 'Asia/Riyadh')
  ON CONFLICT (slug) DO UPDATE SET id = schools.id
  RETURNING id INTO _school_id;

  -- ── 2. Mark all test users as onboarding-completed ────────────────────────
  UPDATE profiles
  SET onboarding_completed = true, school_id = _school_id
  WHERE id IN (_student_id, _teacher_id, _supervisor_id, _pa_id, _ma_id);

  -- ── 3. Create student record (sessions FK to students, not profiles) ──────
  INSERT INTO students (id, school_id)
  VALUES (_student_id, _school_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Program roles ──────────────────────────────────────────────────────
  -- Program admin on 2 programs
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by)
  VALUES
    (_pa_id, _prog1_id, 'program_admin', _ma_id),
    (_pa_id, _prog2_id, 'program_admin', _ma_id)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- Supervisor on prog1
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by)
  VALUES (_supervisor_id, _prog1_id, 'supervisor', _pa_id)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- Teacher on prog1
  INSERT INTO program_roles (profile_id, program_id, role, assigned_by)
  VALUES (_teacher_id, _prog1_id, 'teacher', _pa_id)
  ON CONFLICT (profile_id, program_id, role) DO NOTHING;

  -- ── 5. Link supervisor to teacher ─────────────────────────────────────────
  UPDATE program_roles
  SET supervisor_id = _supervisor_id
  WHERE profile_id = _teacher_id
    AND program_id = _prog1_id
    AND role = 'teacher';

  -- ── 6. Program classes (unified — formerly cohorts) ───────────────────────
  INSERT INTO classes (id, school_id, name, teacher_id, max_students, is_active, program_id, track_id, status, supervisor_id, start_date)
  VALUES
    (_class_a_id, _school_id, 'Morning Class A', _teacher_id, 15, true, _prog1_id, _track1_id, 'enrollment_open', _supervisor_id, CURRENT_DATE),
    (_class_b_id, _school_id, 'Evening Class B', _teacher_id, 10, true, _prog1_id, _track1_id, 'in_progress', _supervisor_id, CURRENT_DATE - INTERVAL '14 days')
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Enrollments ────────────────────────────────────────────────────────
  INSERT INTO enrollments (student_id, program_id, track_id, class_id, teacher_id, status, enrolled_at)
  VALUES
    (_student_id, _prog1_id, _track1_id, _class_b_id, _teacher_id, 'active', now() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

  -- ── 8. Sessions (recent, with program_id for dashboard stats) ─────────────
  -- Disable notification trigger (calls extensions.http_post which is unavailable locally)
  ALTER TABLE sessions DISABLE TRIGGER on_session_insert;

  INSERT INTO sessions (school_id, student_id, teacher_id, program_id, session_date, status, recitation_quality, tajweed_score, memorization_score, notes, created_at)
  VALUES
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE,                  'completed', 4, 4, 5, 'Great session', now()),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '1 day', 'completed', 3, 4, 4, 'Good progress', now() - INTERVAL '1 day'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '2 days', 'completed', 5, 5, 5, 'Excellent',     now() - INTERVAL '2 days'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '3 days', 'completed', 4, 3, 4, 'Needs review',  now() - INTERVAL '3 days'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '5 days', 'completed', 4, 4, 4, 'Steady pace',   now() - INTERVAL '5 days'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '8 days', 'completed', 3, 3, 3, 'Review day',    now() - INTERVAL '8 days'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '12 days','completed', 5, 4, 5, 'Strong finish',  now() - INTERVAL '12 days'),
    (_school_id, _student_id, _teacher_id, _prog1_id, CURRENT_DATE - INTERVAL '15 days','completed', 4, 4, 4, 'Consistent',    now() - INTERVAL '15 days');

  ALTER TABLE sessions ENABLE TRIGGER on_session_insert;

  RAISE NOTICE 'Seed: development data created successfully';
END
$$;
