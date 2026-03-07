-- =============================================================================
-- Migration 00019: Merge legacy 'admin' role into 'master_admin'
-- =============================================================================
-- This migration eliminates the legacy school-scoped 'admin' role by:
-- 1. Migrating existing admin users to master_admin
-- 2. Ensuring master_admin users have a school_id (single-org platform)
-- 3. Updating the CHECK constraint to remove 'admin'
-- 4. Replacing all 44 RLS policies from 'admin' to 'master_admin'
-- 5. Simplifying newer policies that used IN ('admin', 'master_admin')
-- 6. Updating handle_new_profile() to remap 'admin' → 'master_admin'
-- =============================================================================

BEGIN;

-- ─── 1A. Migrate existing admin users ──────────────────────────────────────
UPDATE profiles
SET role = 'master_admin', updated_at = now()
WHERE role = 'admin';

-- ─── 1B. Ensure master_admin users have school_id ──────────────────────────
UPDATE profiles
SET school_id = (SELECT id FROM schools LIMIT 1)
WHERE role = 'master_admin' AND school_id IS NULL;

-- ─── 1C. Update CHECK constraint — remove 'admin' ─────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'parent', 'supervisor', 'program_admin', 'master_admin'));

-- ─── 1D. Replace 44 RLS policies from 00001_consolidated_schema.sql ───────
-- Each policy: DROP old 'admin' version, CREATE new 'master_admin' version.
-- USING/WITH CHECK clauses are identical except the role check.

-- schools (1 policy)
DROP POLICY IF EXISTS "Admin can update own school" ON schools;
CREATE POLICY "Master admin can update own school" ON schools
  FOR UPDATE USING ((id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- profiles (2 policies)
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
CREATE POLICY "Master admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
CREATE POLICY "Master admin can delete profiles" ON profiles
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- classes (3 policies)
DROP POLICY IF EXISTS "Admin can insert classes" ON classes;
CREATE POLICY "Master admin can insert classes" ON classes
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update classes" ON classes;
CREATE POLICY "Master admin can update classes" ON classes
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete classes" ON classes;
CREATE POLICY "Master admin can delete classes" ON classes
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- students (4 policies)
DROP POLICY IF EXISTS "Admin can read all school students" ON students;
CREATE POLICY "Master admin can read all school students" ON students
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert students" ON students;
CREATE POLICY "Master admin can insert students" ON students
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update students" ON students;
CREATE POLICY "Master admin can update students" ON students
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete students" ON students;
CREATE POLICY "Master admin can delete students" ON students
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- sessions (4 policies)
DROP POLICY IF EXISTS "Admin can read all school sessions" ON sessions;
CREATE POLICY "Master admin can read all school sessions" ON sessions
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert sessions" ON sessions;
CREATE POLICY "Master admin can insert sessions" ON sessions
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update sessions" ON sessions;
CREATE POLICY "Master admin can update sessions" ON sessions
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete sessions" ON sessions;
CREATE POLICY "Master admin can delete sessions" ON sessions
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- attendance (4 policies)
DROP POLICY IF EXISTS "Admin can read all school attendance" ON attendance;
CREATE POLICY "Master admin can read all school attendance" ON attendance
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert attendance" ON attendance;
CREATE POLICY "Master admin can insert attendance" ON attendance
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update attendance" ON attendance;
CREATE POLICY "Master admin can update attendance" ON attendance
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete attendance" ON attendance;
CREATE POLICY "Master admin can delete attendance" ON attendance
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- student_stickers (3 policies)
DROP POLICY IF EXISTS "Admin can read school student stickers" ON student_stickers;
CREATE POLICY "Master admin can read school student stickers" ON student_stickers
  FOR SELECT USING ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

DROP POLICY IF EXISTS "Admin can award stickers" ON student_stickers;
CREATE POLICY "Master admin can award stickers" ON student_stickers
  FOR INSERT WITH CHECK ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

DROP POLICY IF EXISTS "Admin can delete student stickers" ON student_stickers;
CREATE POLICY "Master admin can delete student stickers" ON student_stickers
  FOR DELETE USING ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

-- teacher_checkins (4 policies)
DROP POLICY IF EXISTS "Admin can read all school teacher checkins" ON teacher_checkins;
CREATE POLICY "Master admin can read all school teacher checkins" ON teacher_checkins
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert teacher checkins" ON teacher_checkins;
CREATE POLICY "Master admin can insert teacher checkins" ON teacher_checkins
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update teacher checkins" ON teacher_checkins;
CREATE POLICY "Master admin can update teacher checkins" ON teacher_checkins
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete teacher checkins" ON teacher_checkins;
CREATE POLICY "Master admin can delete teacher checkins" ON teacher_checkins
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- teacher_work_schedules (4 policies)
DROP POLICY IF EXISTS "Admin can read school work schedules" ON teacher_work_schedules;
CREATE POLICY "Master admin can read school work schedules" ON teacher_work_schedules
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert work schedules" ON teacher_work_schedules;
CREATE POLICY "Master admin can insert work schedules" ON teacher_work_schedules
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update work schedules" ON teacher_work_schedules;
CREATE POLICY "Master admin can update work schedules" ON teacher_work_schedules
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete work schedules" ON teacher_work_schedules;
CREATE POLICY "Master admin can delete work schedules" ON teacher_work_schedules
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- class_schedules (3 policies)
DROP POLICY IF EXISTS "Admin can insert class schedules" ON class_schedules;
CREATE POLICY "Master admin can insert class schedules" ON class_schedules
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update class schedules" ON class_schedules;
CREATE POLICY "Master admin can update class schedules" ON class_schedules
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete class schedules" ON class_schedules;
CREATE POLICY "Master admin can delete class schedules" ON class_schedules
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- scheduled_sessions (4 policies)
DROP POLICY IF EXISTS "Admin can read all school scheduled sessions" ON scheduled_sessions;
CREATE POLICY "Master admin can read all school scheduled sessions" ON scheduled_sessions
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can insert scheduled sessions" ON scheduled_sessions;
CREATE POLICY "Master admin can insert scheduled sessions" ON scheduled_sessions
  FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can update scheduled sessions" ON scheduled_sessions;
CREATE POLICY "Master admin can update scheduled sessions" ON scheduled_sessions
  FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

DROP POLICY IF EXISTS "Admin can delete scheduled sessions" ON scheduled_sessions;
CREATE POLICY "Master admin can delete scheduled sessions" ON scheduled_sessions
  FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- recitations (1 policy)
DROP POLICY IF EXISTS "Admin can read all school recitations" ON recitations;
CREATE POLICY "Master admin can read all school recitations" ON recitations
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- memorization_progress (1 policy)
DROP POLICY IF EXISTS "Admin can read all school memorization progress" ON memorization_progress;
CREATE POLICY "Master admin can read all school memorization progress" ON memorization_progress
  FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- memorization_assignments (1 policy)
DROP POLICY IF EXISTS "Admin can manage all school assignments" ON memorization_assignments;
CREATE POLICY "Master admin can manage all school assignments" ON memorization_assignments
  FOR ALL USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- student_rub_certifications (4 policies)
DROP POLICY IF EXISTS "Admin can read school student certifications" ON student_rub_certifications;
CREATE POLICY "Master admin can read school student certifications" ON student_rub_certifications
  FOR SELECT USING ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

DROP POLICY IF EXISTS "Admin can insert school student certifications" ON student_rub_certifications;
CREATE POLICY "Master admin can insert school student certifications" ON student_rub_certifications
  FOR INSERT WITH CHECK ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

DROP POLICY IF EXISTS "Admin can update school student certifications" ON student_rub_certifications;
CREATE POLICY "Master admin can update school student certifications" ON student_rub_certifications
  FOR UPDATE USING ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

DROP POLICY IF EXISTS "Admin can delete school student certifications" ON student_rub_certifications;
CREATE POLICY "Master admin can delete school student certifications" ON student_rub_certifications
  FOR DELETE USING ((get_user_role() = 'master_admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));

-- session_recitation_plans (1 policy)
DROP POLICY IF EXISTS "Admin can manage all school recitation plans" ON session_recitation_plans;
CREATE POLICY "Master admin can manage all school recitation plans" ON session_recitation_plans
  FOR ALL USING ((school_id = get_user_school_id()) AND (get_user_role() = 'master_admin'::text));

-- ─── 1E. Simplify policies from newer migrations ──────────────────────────
-- Change IN ('admin', 'master_admin') to = 'master_admin'

-- 00012: student_badges
DROP POLICY IF EXISTS "Admins can read all badges" ON student_badges;
CREATE POLICY "Master admin can read all badges"
  ON student_badges FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

-- 00013: student_guardians
DROP POLICY IF EXISTS "Admins can read all guardians" ON student_guardians;
CREATE POLICY "Master admin can read all guardians"
  ON student_guardians FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

DROP POLICY IF EXISTS "Admins can manage guardians" ON student_guardians;
CREATE POLICY "Master admin can manage guardians"
  ON student_guardians FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

-- 00014: mutoon_progress
DROP POLICY IF EXISTS "Admins can read all mutoon progress" ON mutoon_progress;
CREATE POLICY "Master admin can read all mutoon progress"
  ON mutoon_progress FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

-- 00015: program_waitlist
DROP POLICY IF EXISTS "Program admins can manage waitlist" ON program_waitlist;
CREATE POLICY "Program admins can manage waitlist"
  ON program_waitlist FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = program_waitlist.program_id
        AND pr.role = 'program_admin'
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = program_waitlist.program_id
        AND pr.role = 'program_admin'
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

DROP POLICY IF EXISTS "Admins can read all waitlist" ON program_waitlist;
CREATE POLICY "Master admin can read all waitlist"
  ON program_waitlist FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

-- ─── 1F. Update handle_new_profile() trigger ──────────────────────────────
-- Remap deprecated 'admin' to 'master_admin' for any new user creation
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

  -- Remap deprecated 'admin' to 'master_admin'
  IF _role = 'admin' THEN
    _role := 'master_admin';
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

COMMIT;
