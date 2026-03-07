-- =============================================================================
-- Migration: 00021_class_absorbs_cohort.sql
-- Feature: Unify classes and cohorts into a single entity
-- Description: Enhance the classes table with cohort features (program_id,
--   track_id, status lifecycle, supervisor_id, meeting_link, dates).
--   Migrate all cohort data into classes. Update enrollments and waitlist to
--   reference class_id. Drop the cohorts table entirely.
-- =============================================================================

-- =============================================================================
-- Section 1: Add cohort columns to classes table
-- =============================================================================

ALTER TABLE classes ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS end_date DATE;

-- Status: 'active' for standalone classes, cohort lifecycle for program-linked
ALTER TABLE classes ADD CONSTRAINT classes_status_check
  CHECK (status IN ('active', 'enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'archived'));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_track_id ON classes(track_id) WHERE track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_supervisor_id ON classes(supervisor_id) WHERE supervisor_id IS NOT NULL;

-- =============================================================================
-- Section 2: Add class_id to enrollments and program_waitlist (temporary dual columns)
-- =============================================================================

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id) WHERE class_id IS NOT NULL;

ALTER TABLE program_waitlist ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- =============================================================================
-- Section 3: Migrate cohort data into classes
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  v_school_id uuid;
  v_class_id uuid;
  v_is_active boolean;
BEGIN
  FOR r IN SELECT * FROM cohorts LOOP
    -- Get school_id from the teacher's profile
    SELECT school_id INTO v_school_id FROM profiles WHERE id = r.teacher_id;
    v_is_active := r.status NOT IN ('completed', 'archived');

    -- Create a class row with all cohort data
    INSERT INTO classes (
      school_id, name, teacher_id, max_students, schedule, is_active,
      program_id, track_id, status, supervisor_id, meeting_link, start_date, end_date
    )
    VALUES (
      v_school_id, r.name, r.teacher_id, r.max_students, r.schedule, v_is_active,
      r.program_id, r.track_id, r.status, r.supervisor_id, r.meeting_link, r.start_date, r.end_date
    )
    RETURNING id INTO v_class_id;

    -- Point enrollments to the new class
    UPDATE enrollments SET class_id = v_class_id WHERE cohort_id = r.id;

    -- Point waitlist entries to the new class
    UPDATE program_waitlist SET class_id = v_class_id WHERE cohort_id = r.id;
  END LOOP;
END $$;

-- Sync active enrollments to students.class_id (only if student has no class yet)
UPDATE students s
SET class_id = e.class_id
FROM enrollments e
WHERE e.student_id = s.id
  AND e.status = 'active'
  AND e.class_id IS NOT NULL
  AND s.class_id IS NULL;

-- =============================================================================
-- Section 4: Drop cohort_id columns and cohorts table
-- =============================================================================

-- Drop the enrollment unique index that uses cohort_id
DROP INDEX IF EXISTS idx_enrollments_unique_student_program;
DROP INDEX IF EXISTS idx_enrollments_cohort_id;

-- Drop RLS policy that references cohort_id before dropping the column
DROP POLICY IF EXISTS "Enrollments: teacher read" ON enrollments;

-- Drop cohort_id from enrollments
ALTER TABLE enrollments DROP COLUMN IF EXISTS cohort_id;

-- Recreate the enrollment uniqueness index using class_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique_student_program
  ON enrollments (
    student_id,
    program_id,
    COALESCE(track_id, '00000000-0000-0000-0000-000000000000'),
    COALESCE(class_id, '00000000-0000-0000-0000-000000000000')
  );

-- Drop cohort_id unique constraint and column from program_waitlist
ALTER TABLE program_waitlist DROP CONSTRAINT IF EXISTS program_waitlist_unique;
ALTER TABLE program_waitlist DROP CONSTRAINT IF EXISTS program_waitlist_student_id_cohort_id_key;
DROP INDEX IF EXISTS idx_program_waitlist_cohort_id;
ALTER TABLE program_waitlist DROP COLUMN IF EXISTS cohort_id;

-- Add class_id-based unique constraint to program_waitlist
ALTER TABLE program_waitlist ADD CONSTRAINT program_waitlist_student_class_unique
  UNIQUE (student_id, class_id);

-- Make class_id NOT NULL on program_waitlist (was cohort_id NOT NULL)
ALTER TABLE program_waitlist ALTER COLUMN class_id SET NOT NULL;

-- Drop cohort indexes before dropping the table
DROP INDEX IF EXISTS idx_cohorts_program_id;
DROP INDEX IF EXISTS idx_cohorts_track_id;
DROP INDEX IF EXISTS idx_cohorts_status;
DROP INDEX IF EXISTS idx_cohorts_teacher_id;

-- Drop cohorts table (CASCADE removes FK constraints, triggers, RLS policies)
DROP TABLE IF EXISTS cohorts CASCADE;

-- =============================================================================
-- Section 5: Enrollment sync trigger — auto-assign students.class_id
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_enrollment_to_class()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On approval: assign student to the enrollment's class
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status != 'active') THEN
    IF NEW.class_id IS NOT NULL THEN
      UPDATE students SET class_id = NEW.class_id WHERE id = NEW.student_id;
    END IF;
  END IF;

  -- On drop: clear class assignment if it matches
  IF NEW.status = 'dropped' AND TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    IF NEW.class_id IS NOT NULL THEN
      UPDATE students SET class_id = NULL
      WHERE id = NEW.student_id AND class_id = NEW.class_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enrollment_class_sync
  AFTER INSERT OR UPDATE OF status ON enrollments
  FOR EACH ROW EXECUTE FUNCTION sync_enrollment_to_class();

-- =============================================================================
-- Section 6: Update RPC — enroll_student (p_cohort_id → p_class_id)
-- =============================================================================

-- Must drop first because parameter names changed
DROP FUNCTION IF EXISTS enroll_student(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION enroll_student(
  p_program_id uuid,
  p_track_id uuid DEFAULT NULL,
  p_class_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enrollment_id uuid;
  v_program programs;
  v_class classes;
  v_track program_tracks;
  v_current_count integer;
  v_status text;
  v_effective_type text;
  v_waitlist_position integer;
BEGIN
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate caller has student role
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'student' THEN
    RAISE EXCEPTION 'Only students can enroll';
  END IF;

  -- Get program
  SELECT * INTO v_program FROM programs WHERE id = p_program_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ENROLL_PROGRAM_NOT_FOUND';
  END IF;

  -- Determine effective enrollment type
  IF v_program.category = 'mixed' AND p_track_id IS NOT NULL THEN
    SELECT * INTO v_track FROM program_tracks WHERE id = p_track_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'ENROLL_TRACK_NOT_FOUND'; END IF;
    v_effective_type := COALESCE(v_track.track_type, 'free');
  ELSIF v_program.category = 'mixed' AND p_track_id IS NULL THEN
    v_effective_type := 'free';
  ELSE
    v_effective_type := v_program.category;
  END IF;

  -- Free enrollment path: direct active enrollment
  IF v_effective_type = 'free' THEN
    INSERT INTO enrollments (student_id, program_id, track_id, status)
    VALUES (auth.uid(), p_program_id, p_track_id, 'active')
    RETURNING id INTO v_enrollment_id;
    RETURN v_enrollment_id;
  END IF;

  -- Structured enrollment path: require class
  IF p_class_id IS NULL THEN
    RAISE EXCEPTION 'ENROLL_CLASS_REQUIRED';
  END IF;

  -- Lock and check class
  SELECT * INTO v_class FROM classes WHERE id = p_class_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ENROLL_CLASS_NOT_FOUND'; END IF;
  IF v_class.status != 'enrollment_open' THEN
    RAISE EXCEPTION 'ENROLL_CLASS_CLOSED';
  END IF;

  -- Check capacity (pending + active consume capacity)
  SELECT count(*) INTO v_current_count
  FROM enrollments
  WHERE class_id = p_class_id AND status IN ('pending', 'active');

  IF v_current_count >= v_class.max_students THEN
    v_status := 'waitlisted';
  ELSIF (v_program.settings->>'auto_approve')::boolean IS TRUE THEN
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO enrollments (student_id, program_id, track_id, class_id, teacher_id, status)
  VALUES (auth.uid(), p_program_id, p_track_id, p_class_id, v_class.teacher_id, v_status)
  RETURNING id INTO v_enrollment_id;

  -- If waitlisted, also insert into program_waitlist for tracking
  IF v_status = 'waitlisted' THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_waitlist_position
    FROM program_waitlist
    WHERE class_id = p_class_id AND status = 'waiting';

    INSERT INTO program_waitlist (student_id, program_id, class_id, track_id, position)
    VALUES (auth.uid(), p_program_id, p_class_id, p_track_id, v_waitlist_position);
  END IF;

  RETURN v_enrollment_id;
END;
$$;

-- =============================================================================
-- Section 7: Update RPC — promote_from_waitlist (p_cohort_id → p_class_id)
-- =============================================================================

-- Must drop first because parameter name changed
DROP FUNCTION IF EXISTS promote_from_waitlist(uuid);

CREATE OR REPLACE FUNCTION promote_from_waitlist(p_class_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class classes;
  v_current_count INTEGER;
  v_available_spots INTEGER;
  v_promoted INTEGER := 0;
  v_waitlist RECORD;
BEGIN
  -- Lock class for atomic capacity check
  SELECT * INTO v_class FROM classes WHERE id = p_class_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Count current active + pending enrollments
  SELECT count(*) INTO v_current_count
  FROM enrollments
  WHERE class_id = p_class_id AND status IN ('pending', 'active');

  v_available_spots := v_class.max_students - v_current_count;
  IF v_available_spots <= 0 THEN RETURN 0; END IF;

  -- Promote waitlisted students in FIFO order
  FOR v_waitlist IN
    SELECT pw.id, pw.student_id, pw.program_id, pw.track_id
    FROM program_waitlist pw
    WHERE pw.class_id = p_class_id AND pw.status = 'waiting'
    ORDER BY pw.position, pw.created_at
    LIMIT v_available_spots
  LOOP
    -- Update waitlist entry to offered
    UPDATE program_waitlist
    SET status = 'offered',
        notified_at = now(),
        expires_at = now() + INTERVAL '48 hours'
    WHERE id = v_waitlist.id;

    -- Update the enrollment from waitlisted to active
    UPDATE enrollments
    SET status = 'active', updated_at = now()
    WHERE student_id = v_waitlist.student_id
      AND class_id = p_class_id
      AND status = 'waitlisted';

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$$;

-- =============================================================================
-- Section 8: Update RPC — get_master_admin_programs_enriched (cohorts → classes)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_master_admin_programs_enriched()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'master_admin' THEN
    RAISE EXCEPTION 'Master admin role required';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.sort_order), '[]'::json)
  INTO v_result
  FROM (
    SELECT
      p.id,
      p.name,
      p.name_ar,
      p.description,
      p.description_ar,
      p.category,
      p.is_active,
      p.settings,
      p.sort_order,
      p.created_at,
      p.updated_at,
      (SELECT count(*)::int FROM enrollments e
       WHERE e.program_id = p.id AND e.status IN ('active', 'approved')) AS enrolled_count,
      (SELECT count(*)::int FROM program_roles pr
       WHERE pr.program_id = p.id) AS team_count,
      (SELECT count(*)::int FROM classes c
       WHERE c.program_id = p.id AND c.status IN ('enrollment_open', 'in_progress')) AS active_class_count,
      (SELECT count(*)::int FROM program_tracks pt
       WHERE pt.program_id = p.id AND pt.is_active = true) AS track_count,
      (SELECT count(*)::int FROM sessions s
       WHERE s.program_id = p.id AND s.created_at >= (now() - interval '7 days')) AS session_count_7d
    FROM programs p
    ORDER BY p.sort_order
  ) sub;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- Section 9: Update RPC — get_program_admin_dashboard_stats (cohorts → classes)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_program_admin_dashboard_stats(p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Allow master_admin
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

  RETURN json_build_object(
    'total_enrolled', (
      SELECT count(*) FROM enrollments
      WHERE program_id = p_program_id AND status IN ('active', 'approved')
    ),
    'active_classes', (
      SELECT count(*) FROM classes
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
  );
END;
$$;

-- =============================================================================
-- Section 10: RLS policies for program-linked classes
-- =============================================================================

-- Program admins can insert classes linked to their programs
CREATE POLICY "Program admin can insert program classes" ON classes
  FOR INSERT TO authenticated
  WITH CHECK (
    program_id IS NOT NULL
    AND (
      get_user_role() = 'master_admin'
      OR (
        get_user_role() = 'program_admin'
        AND program_id = ANY(get_user_programs())
      )
    )
  );

-- Program admins can update classes linked to their programs
CREATE POLICY "Program admin can update program classes" ON classes
  FOR UPDATE TO authenticated
  USING (
    program_id IS NOT NULL
    AND (
      get_user_role() = 'master_admin'
      OR (
        get_user_role() = 'program_admin'
        AND program_id = ANY(get_user_programs())
      )
    )
  );

-- Update enrollments RLS: teacher read policy (was using cohorts subquery)
DROP POLICY IF EXISTS "Enrollments: teacher read" ON enrollments;
CREATE POLICY "Enrollments: teacher read" ON enrollments
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'teacher'
    AND (
      teacher_id = auth.uid()
      OR class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    )
  );

-- =============================================================================
-- Section 11: Update get_user_programs to include class-based enrollment
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_programs()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT program_id),
    '{}'::uuid[]
  )
  FROM (
    SELECT program_id FROM program_roles WHERE profile_id = auth.uid()
    UNION
    SELECT program_id FROM enrollments WHERE student_id = auth.uid()
  ) sub
$$;
