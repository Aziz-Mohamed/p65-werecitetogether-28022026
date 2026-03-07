-- =============================================================================
-- Migration 00020: Remove 'parent' role — merge into student_guardians
-- =============================================================================
-- This migration eliminates the 'parent' role by:
-- 1. Migrating parent profile data into student_guardians entries
-- 2. Converting parent users to 'student' role
-- 3. Updating the CHECK constraint to remove 'parent'
-- 4. Dropping all 11 parent-specific RLS policies
-- 5. Updating handle_new_profile() to remap 'parent' → 'student'
-- 6. Marking students.parent_id as deprecated
--
-- Unlike the admin → master_admin migration (00019) which was a 1:1 rename,
-- this is a role elimination: parents become metadata in student_guardians,
-- not separate user accounts.
-- =============================================================================

BEGIN;

-- ─── 1A. Migrate parent data to student_guardians ──────────────────────────
-- For each student linked to a parent via parent_id, create a guardian entry
-- using the parent profile's info. Skip if a guardian already exists for that
-- student from a prior manual entry.
INSERT INTO student_guardians (student_id, guardian_name, guardian_phone, guardian_email, relationship, is_primary)
SELECT
  s.id AS student_id,
  p.full_name AS guardian_name,
  p.phone AS guardian_phone,
  u.email AS guardian_email,
  'parent' AS relationship,
  true AS is_primary
FROM students s
JOIN profiles p ON p.id = s.parent_id
LEFT JOIN auth.users u ON u.id = p.id
WHERE s.parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM student_guardians sg
    WHERE sg.student_id = s.id AND sg.is_primary = true
  );

-- ─── 1B. Migrate parent profiles to 'student' role ────────────────────────
UPDATE profiles
SET role = 'student', updated_at = now()
WHERE role = 'parent';

-- ─── 1C. Update CHECK constraint — remove 'parent' ────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'supervisor', 'program_admin', 'master_admin'));

-- ─── 1D. Drop 10 parent-specific RLS policies from 00001 ──────────────────
-- These all use get_user_role() = 'parent' and students.parent_id = auth.uid()
-- No replacements needed — guardians are metadata, not auth users.

DROP POLICY IF EXISTS "Parent can read children" ON students;
DROP POLICY IF EXISTS "Parent can read children sessions" ON sessions;
DROP POLICY IF EXISTS "Parent can read children attendance" ON attendance;
DROP POLICY IF EXISTS "Parent can read children stickers" ON student_stickers;
DROP POLICY IF EXISTS "Parent can read children scheduled sessions" ON scheduled_sessions;
DROP POLICY IF EXISTS "Parent can read children recitations" ON recitations;
DROP POLICY IF EXISTS "Parent can read children memorization progress" ON memorization_progress;
DROP POLICY IF EXISTS "Parent can read children assignments" ON memorization_assignments;
DROP POLICY IF EXISTS "Parent can read children certifications" ON student_rub_certifications;
DROP POLICY IF EXISTS "Parent can read children recitation plans" ON session_recitation_plans;

-- ─── 1E. Drop parent-specific RLS policy from 00013 ───────────────────────
-- This policy references students.parent_id = auth.uid() which is no longer valid
DROP POLICY IF EXISTS "Parents can read child guardians" ON student_guardians;

-- ─── 1F. Update handle_new_profile() trigger ──────────────────────────────
-- Remap deprecated 'parent' to 'student' alongside existing 'admin' → 'master_admin'
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _full_name TEXT;
  _role TEXT;
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Remap deprecated roles
  IF _role = 'admin' THEN
    _role := 'master_admin';
  END IF;
  IF _role = 'parent' THEN
    _role := 'student';
  END IF;

  INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::UUID,
    _role,
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

-- ─── 1G. Deprecation comment on students.parent_id ─────────────────────────
COMMENT ON COLUMN students.parent_id IS 'DEPRECATED: Use student_guardians table for guardian metadata. Kept for backward compatibility per PRD Section 0.5. Do not use in new code.';

COMMIT;
