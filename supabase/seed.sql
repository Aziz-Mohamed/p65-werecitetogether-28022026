-- Seed: Development test users (one per role)
-- These users are created for dev pill sign-in on the simulator.
-- The handle_new_profile trigger auto-creates profile rows.

-- Helper: Create test users using Supabase auth.users directly
-- Password: devtest123 (bcrypt hash)

DO $$
DECLARE
  _password_hash TEXT := crypt('devtest123', gen_salt('bf'));
  _roles TEXT[] := ARRAY['student', 'teacher', 'parent', 'admin', 'supervisor', 'program_admin', 'master_admin'];
  _names TEXT[] := ARRAY['Test Student', 'Test Teacher', 'Test Parent', 'Test Admin', 'Test Supervisor', 'Test Program Admin', 'Test Master Admin'];
  _slugs TEXT[] := ARRAY['student', 'teacher', 'parent', 'admin', 'supervisor', 'program-admin', 'master-admin'];
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
