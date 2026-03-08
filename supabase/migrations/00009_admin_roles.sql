-- =============================================================================
-- Migration: Admin Roles — Supervisor & Admin Panels
-- Feature: 007-admin-roles
-- Date: 2026-03-06
-- Description: Add supervisor_id to program_roles, create platform_config
--   table, RLS policies, 8 RPC functions for admin dashboards, and seed data.
-- =============================================================================

-- =============================================================================
-- Section 1: Schema Changes
-- =============================================================================

-- Add supervisor_id to program_roles for per-program supervisor-teacher linking
ALTER TABLE program_roles
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN program_roles.supervisor_id IS
  'For teacher rows: the supervisor responsible for this teacher in this program. NULL for non-teacher roles.';

CREATE INDEX IF NOT EXISTS idx_program_roles_supervisor_id
  ON program_roles (supervisor_id) WHERE supervisor_id IS NOT NULL;

-- platform_config: Global platform settings (single-row table)
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'WeReciteTogether',
  name_ar TEXT NOT NULL DEFAULT 'نتلو معاً',
  description TEXT,
  logo_url TEXT,
  default_meeting_platform TEXT CHECK (
    default_meeting_platform IS NULL
    OR default_meeting_platform IN ('google_meet', 'zoom', 'jitsi', 'other')
  ),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger for platform_config
DROP TRIGGER IF EXISTS set_updated_at ON platform_config;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Section 2: RLS Policies for platform_config
-- =============================================================================

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read platform config
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_config' AND policyname = 'PlatformConfig: authenticated read') THEN
    CREATE POLICY "PlatformConfig: authenticated read" ON platform_config
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Only master_admin can update platform config
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_config' AND policyname = 'PlatformConfig: master_admin update') THEN
    CREATE POLICY "PlatformConfig: master_admin update" ON platform_config
      FOR UPDATE TO authenticated USING (get_user_role() = 'master_admin');
  END IF;
END $$;

-- Add supervisor read policy for program_roles (supervisors can see roles in their programs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: supervisor read') THEN
    CREATE POLICY "ProgramRoles: supervisor read" ON program_roles
      FOR SELECT TO authenticated USING (
        get_user_role() = 'supervisor'
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

-- Allow program_admin to update program_roles (for linking supervisors)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: admin update') THEN
    CREATE POLICY "ProgramRoles: admin update" ON program_roles
      FOR UPDATE TO authenticated USING (
        (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
        OR get_user_role() = 'master_admin'
      );
  END IF;
END $$;

-- =============================================================================
-- Section 3: RPC Functions
-- =============================================================================

-- ─── get_supervisor_dashboard_stats ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_supervisor_dashboard_stats(p_supervisor_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_teacher_ids uuid[];
BEGIN
  -- Validate caller
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'supervisor' THEN
    RAISE EXCEPTION 'Supervisor role required';
  END IF;

  -- Get teacher IDs supervised by this supervisor
  SELECT array_agg(profile_id) INTO v_teacher_ids
  FROM program_roles
  WHERE supervisor_id = p_supervisor_id AND role = 'teacher';

  IF v_teacher_ids IS NULL THEN
    v_teacher_ids := '{}'::uuid[];
  END IF;

  SELECT json_build_object(
    'teacher_count', COALESCE(array_length(v_teacher_ids, 1), 0),
    'student_count', (
      SELECT count(DISTINCT student_id)
      FROM enrollments
      WHERE teacher_id = ANY(v_teacher_ids)
        AND status IN ('active', 'approved')
    ),
    'sessions_this_week', (
      SELECT count(*)
      FROM sessions
      WHERE teacher_id = ANY(v_teacher_ids)
        AND created_at >= (now() - interval '7 days')
    ),
    'inactive_teachers', (
      SELECT COALESCE(json_agg(tid), '[]'::json)
      FROM unnest(v_teacher_ids) AS tid
      WHERE NOT EXISTS (
        SELECT 1 FROM sessions
        WHERE teacher_id = tid
          AND created_at >= (now() - interval '7 days')
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── get_supervised_teachers ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_supervised_teachers(p_supervisor_id uuid)
RETURNS TABLE(
  teacher_id uuid,
  full_name text,
  avatar_url text,
  program_id uuid,
  program_name text,
  student_count bigint,
  sessions_this_week bigint,
  average_rating numeric,
  is_active boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) NOT IN ('supervisor', 'master_admin') THEN
    RAISE EXCEPTION 'Supervisor or master_admin role required';
  END IF;

  RETURN QUERY
  SELECT
    pr.profile_id AS teacher_id,
    p.full_name,
    p.avatar_url,
    pr.program_id,
    prog.name AS program_name,
    (
      SELECT count(DISTINCT e.student_id)
      FROM enrollments e
      WHERE e.teacher_id = pr.profile_id
        AND e.program_id = pr.program_id
        AND e.status IN ('active', 'approved')
    ) AS student_count,
    (
      SELECT count(*)
      FROM sessions s
      WHERE s.teacher_id = pr.profile_id
        AND s.created_at >= (now() - interval '7 days')
    ) AS sessions_this_week,
    (
      SELECT trs.average_rating
      FROM teacher_rating_stats trs
      WHERE trs.teacher_id = pr.profile_id
    ) AS average_rating,
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.teacher_id = pr.profile_id
        AND s.created_at >= (now() - interval '7 days')
    ) AS is_active
  FROM program_roles pr
  JOIN profiles p ON p.id = pr.profile_id
  JOIN programs prog ON prog.id = pr.program_id
  WHERE pr.supervisor_id = p_supervisor_id
    AND pr.role = 'teacher';
END;
$$;

-- ─── get_program_admin_dashboard_stats ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_program_admin_dashboard_stats(p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  -- Verify caller is PA for this program or master_admin
  IF (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin' THEN
    -- allowed
  ELSIF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = p_program_id
      AND role = 'program_admin'
  ) THEN
    RAISE EXCEPTION 'Program admin role required for this program';
  END IF;

  SELECT json_build_object(
    'total_enrolled', (
      SELECT count(*) FROM enrollments
      WHERE program_id = p_program_id AND status IN ('active', 'approved')
    ),
    'active_cohorts', (
      SELECT count(*) FROM cohorts
      WHERE program_id = p_program_id AND status IN ('enrollment_open', 'in_progress')
    ),
    'total_teachers', (
      SELECT count(*) FROM program_roles
      WHERE program_id = p_program_id AND role = 'teacher'
    ),
    'sessions_this_week', (
      SELECT count(*) FROM sessions
      WHERE program_id = p_program_id
        AND created_at >= (now() - interval '7 days')
    ),
    'pending_enrollments', (
      SELECT count(*) FROM enrollments
      WHERE program_id = p_program_id AND status = 'pending'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── get_master_admin_dashboard_stats ────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_master_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  SELECT json_build_object(
    'total_students', (
      SELECT count(*) FROM profiles WHERE role = 'student'
    ),
    'total_teachers', (
      SELECT count(*) FROM profiles WHERE role = 'teacher'
    ),
    'total_active_sessions', (
      SELECT count(*) FROM sessions
      WHERE created_at >= (now() - interval '7 days')
    ),
    'programs', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
      FROM (
        SELECT
          prog.id AS program_id,
          prog.name,
          prog.name_ar,
          (SELECT count(*) FROM enrollments e WHERE e.program_id = prog.id AND e.status IN ('active', 'approved')) AS enrolled_count,
          (SELECT count(*) FROM sessions s WHERE s.program_id = prog.id AND s.created_at >= (now() - interval '7 days')) AS session_count
        FROM programs prog
        WHERE prog.is_active = true
        ORDER BY prog.sort_order
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ─── reassign_student ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reassign_student(
  p_enrollment_id uuid,
  p_new_teacher_id uuid,
  p_supervisor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment enrollments;
  v_caller_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  v_caller_role := (SELECT role FROM profiles WHERE id = auth.uid());
  IF v_caller_role NOT IN ('supervisor', 'master_admin') THEN
    RAISE EXCEPTION 'Supervisor or master_admin role required';
  END IF;

  -- Get the enrollment
  SELECT * INTO v_enrollment FROM enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;

  -- If supervisor, validate they supervise both source and target teachers
  IF v_caller_role = 'supervisor' THEN
    IF NOT EXISTS (
      SELECT 1 FROM program_roles
      WHERE profile_id = v_enrollment.teacher_id
        AND program_id = v_enrollment.program_id
        AND supervisor_id = p_supervisor_id
        AND role = 'teacher'
    ) THEN
      RAISE EXCEPTION 'Source teacher is not supervised by you in this program';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM program_roles
      WHERE profile_id = p_new_teacher_id
        AND program_id = v_enrollment.program_id
        AND supervisor_id = p_supervisor_id
        AND role = 'teacher'
    ) THEN
      RAISE EXCEPTION 'Target teacher is not supervised by you in this program';
    END IF;
  END IF;

  -- Validate new teacher belongs to the same program
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = p_new_teacher_id
      AND program_id = v_enrollment.program_id
      AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Target teacher is not assigned to this program';
  END IF;

  -- Reassign
  UPDATE enrollments
  SET teacher_id = p_new_teacher_id, updated_at = now()
  WHERE id = p_enrollment_id;
END;
$$;

-- ─── search_users_for_role_assignment ────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_users_for_role_assignment(
  p_search_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  role text,
  avatar_url text,
  created_at timestamptz,
  program_roles_data json
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.avatar_url,
    p.created_at,
    (
      SELECT COALESCE(json_agg(json_build_object(
        'program_id', pr.program_id,
        'program_name', prog.name,
        'role', pr.role
      )), '[]'::json)
      FROM program_roles pr
      JOIN programs prog ON prog.id = pr.program_id
      WHERE pr.profile_id = p.id
    ) AS program_roles_data
  FROM profiles p
  WHERE p.full_name ILIKE '%' || p_search_query || '%'
     OR p.email ILIKE '%' || p_search_query || '%'
  ORDER BY p.full_name
  LIMIT p_limit;
END;
$$;

-- ─── assign_master_admin_role ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_master_admin_role(
  p_user_id uuid,
  p_assigned_by uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  -- Check if user is already master_admin
  IF (SELECT role FROM profiles WHERE id = p_user_id) = 'master_admin' THEN
    RAISE EXCEPTION 'User is already a master admin';
  END IF;

  -- Promote user
  UPDATE profiles
  SET role = 'master_admin', updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- ─── revoke_master_admin_role ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION revoke_master_admin_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  -- Verify user is currently master_admin
  IF (SELECT role FROM profiles WHERE id = p_user_id) != 'master_admin' THEN
    RAISE EXCEPTION 'User is not a master admin';
  END IF;

  -- Check this is not the last master_admin
  SELECT count(*) INTO v_admin_count
  FROM profiles WHERE role = 'master_admin';

  IF v_admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last master admin';
  END IF;

  -- Demote to teacher (safest default role)
  UPDATE profiles
  SET role = 'teacher', updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- =============================================================================
-- Section 4: Seed Data
-- =============================================================================

-- Insert default platform config row
INSERT INTO platform_config (name, name_ar, settings)
VALUES (
  'WeReciteTogether',
  'نتلو معاً',
  '{
    "notification_defaults": {
      "quiet_hours_enabled": false,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "06:00"
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;
