-- =============================================================================
-- Migration: Teacher Availability (Green Dot System)
-- Feature: 004-teacher-availability
-- Date: 2026-03-06
-- Description: ALTER profiles (+meeting_link, +meeting_platform, +languages),
--   CREATE teacher_availability table, 2 RPC functions, 2 triggers,
--   8 RLS policies, 3 indexes, Realtime publication, pg_cron job.
-- =============================================================================

-- =============================================================================
-- Section 1: ALTER profiles — add teacher availability columns
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meeting_platform TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Add CHECK constraint for meeting_platform
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_meeting_platform_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_meeting_platform_check
      CHECK (meeting_platform IS NULL OR meeting_platform IN ('google_meet', 'zoom', 'jitsi', 'other'));
  END IF;
END $$;

-- =============================================================================
-- Section 2: CREATE teacher_availability table
-- =============================================================================

CREATE TABLE IF NOT EXISTS teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  available_since TIMESTAMPTZ,
  max_students INTEGER NOT NULL DEFAULT 1,
  active_student_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_availability_max_students_check CHECK (max_students BETWEEN 1 AND 10),
  CONSTRAINT teacher_availability_active_count_check CHECK (active_student_count >= 0),
  CONSTRAINT teacher_availability_unique UNIQUE (teacher_id, program_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_availability_available
  ON teacher_availability (program_id) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher
  ON teacher_availability (teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_availability_stale
  ON teacher_availability (available_since) WHERE is_available = true;

-- =============================================================================
-- Section 3: RPC — toggle_availability
-- =============================================================================

CREATE OR REPLACE FUNCTION toggle_availability(
  p_program_id uuid,
  p_is_available boolean,
  p_max_students integer DEFAULT 1
)
RETURNS SETOF teacher_availability
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_teacher_id uuid := auth.uid();
  v_meeting_link text;
  v_has_role boolean;
BEGIN
  -- Validate caller is authenticated
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_is_available THEN
    -- Check teacher has meeting_link configured
    SELECT meeting_link INTO v_meeting_link
    FROM profiles WHERE id = v_teacher_id;

    IF v_meeting_link IS NULL OR v_meeting_link = '' THEN
      RAISE EXCEPTION 'AVAILABILITY_NO_MEETING_LINK';
    END IF;

    -- Check teacher has role in program
    SELECT EXISTS(
      SELECT 1 FROM program_roles
      WHERE profile_id = v_teacher_id
        AND program_id = p_program_id
        AND role = 'teacher'
    ) INTO v_has_role;

    IF NOT v_has_role THEN
      RAISE EXCEPTION 'AVAILABILITY_NO_PROGRAM_ROLE';
    END IF;

    -- UPSERT: go available
    INSERT INTO teacher_availability (teacher_id, program_id, is_available, available_since, max_students, active_student_count)
    VALUES (v_teacher_id, p_program_id, true, now(), p_max_students, 0)
    ON CONFLICT (teacher_id, program_id)
    DO UPDATE SET
      is_available = true,
      available_since = now(),
      max_students = p_max_students,
      active_student_count = 0;
  ELSE
    -- UPSERT: go offline
    INSERT INTO teacher_availability (teacher_id, program_id, is_available, available_since, max_students, active_student_count)
    VALUES (v_teacher_id, p_program_id, false, NULL, p_max_students, 0)
    ON CONFLICT (teacher_id, program_id)
    DO UPDATE SET
      is_available = false,
      available_since = NULL,
      active_student_count = 0;
  END IF;

  RETURN QUERY SELECT * FROM teacher_availability
    WHERE teacher_id = v_teacher_id AND program_id = p_program_id;
END;
$$;

-- =============================================================================
-- Section 4: RPC — join_teacher_session
-- =============================================================================

CREATE OR REPLACE FUNCTION join_teacher_session(p_availability_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row teacher_availability;
BEGIN
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock the row for atomic update
  SELECT * INTO v_row
  FROM teacher_availability
  WHERE id = p_availability_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check availability and capacity
  IF NOT v_row.is_available THEN
    RETURN false;
  END IF;

  IF v_row.active_student_count >= v_row.max_students THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE teacher_availability
  SET active_student_count = active_student_count + 1
  WHERE id = p_availability_id;

  RETURN true;
END;
$$;

-- =============================================================================
-- Section 5: Trigger — clear availability on program_roles DELETE
-- =============================================================================

CREATE OR REPLACE FUNCTION clear_teacher_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'teacher' THEN
    UPDATE teacher_availability
    SET is_available = false,
        available_since = NULL,
        active_student_count = 0
    WHERE teacher_id = OLD.profile_id
      AND program_id = OLD.program_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_program_role_delete ON program_roles;
CREATE TRIGGER on_program_role_delete
  AFTER DELETE ON program_roles
  FOR EACH ROW EXECUTE FUNCTION clear_teacher_availability();

-- =============================================================================
-- Section 6: Trigger — updated_at (reuse handle_updated_at)
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at ON teacher_availability;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON teacher_availability
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Section 7: RLS Policies
-- =============================================================================

ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

-- Student: can read available teachers for enrolled programs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: student read enrolled') THEN
    CREATE POLICY "TA: student read enrolled" ON teacher_availability
      FOR SELECT TO authenticated USING (
        get_user_role() = 'student'
        AND is_available = true
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

-- Teacher: read own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: teacher read own') THEN
    CREATE POLICY "TA: teacher read own" ON teacher_availability
      FOR SELECT TO authenticated USING (
        get_user_role() = 'teacher'
        AND teacher_id = auth.uid()
      );
  END IF;
END $$;

-- Teacher: insert own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: teacher insert own') THEN
    CREATE POLICY "TA: teacher insert own" ON teacher_availability
      FOR INSERT TO authenticated WITH CHECK (
        get_user_role() = 'teacher'
        AND teacher_id = auth.uid()
      );
  END IF;
END $$;

-- Teacher: update own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: teacher update own') THEN
    CREATE POLICY "TA: teacher update own" ON teacher_availability
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'teacher'
        AND teacher_id = auth.uid()
      );
  END IF;
END $$;

-- Master admin: read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: admin read all') THEN
    CREATE POLICY "TA: admin read all" ON teacher_availability
      FOR SELECT TO authenticated USING (
        get_user_role() = 'master_admin'
      );
  END IF;
END $$;

-- Admin/program_admin: update
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: admin update') THEN
    CREATE POLICY "TA: admin update" ON teacher_availability
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

-- Supervisor: read assigned programs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: supervisor read assigned') THEN
    CREATE POLICY "TA: supervisor read assigned" ON teacher_availability
      FOR SELECT TO authenticated USING (
        get_user_role() = 'supervisor'
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

-- Program admin: read assigned programs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_availability' AND policyname = 'TA: program_admin read assigned') THEN
    CREATE POLICY "TA: program_admin read assigned" ON teacher_availability
      FOR SELECT TO authenticated USING (
        get_user_role() = 'program_admin'
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

-- =============================================================================
-- Section 8: Realtime publication
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE teacher_availability;

-- =============================================================================
-- Section 9: pg_cron job — expire stale availability (every 15 min)
-- =============================================================================

SELECT cron.schedule(
  'expire-stale-availability',
  '*/15 * * * *',
  $$UPDATE public.teacher_availability
    SET is_available = false,
        available_since = NULL,
        active_student_count = 0
    WHERE is_available = true
      AND available_since < now() - interval '4 hours'$$
);
