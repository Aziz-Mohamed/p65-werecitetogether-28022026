-- Migration: Auth Evolution (OAuth)
-- Feature: 001-auth-evolution
-- Date: 2026-03-03
-- Description: Extend profiles for OAuth users — make school_id nullable,
--   extend role CHECK to 7 roles, add onboarding fields, update trigger
--   for OAuth metadata, add role self-update prevention trigger, add RLS.

-- ─── 1. profiles table — ALTER ──────────────────────────────────────────────

-- Make school_id nullable for OAuth users
ALTER TABLE profiles ALTER COLUMN school_id DROP NOT NULL;

-- Extend role CHECK constraint to 7 roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'parent', 'admin',
                  'supervisor', 'program_admin', 'master_admin'));

-- Add onboarding fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- ─── 2. handle_new_profile() — REPLACE ─────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _full_name TEXT;
BEGIN
  -- Resolve full_name: custom metadata > OAuth 'name' > email prefix
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::UUID,  -- NULL for OAuth users
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    _full_name,
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      (NEW.raw_user_meta_data->>'name_localized')::JSONB,
      jsonb_build_object('en', _full_name)
    )
  );
  RETURN NEW;
END;
$$;

-- ─── 3. prevent_role_self_update() — NEW (FR-020) ──────────────────────────

CREATE OR REPLACE FUNCTION prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_setting('role', true) NOT IN ('service_role', 'supabase_admin', 'postgres') THEN
    RAISE EXCEPTION 'Role changes must go through the admin edge function';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS enforce_role_update_via_service ON profiles;

CREATE TRIGGER enforce_role_update_via_service
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_self_update();

-- ─── 4. RLS — "Users can read own profile" ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" ON profiles
      FOR SELECT USING (id = auth.uid());
  END IF;
END
$$;
