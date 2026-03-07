-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00017_enroll_student_waitlist_insert.sql
-- Feature: Update enroll_student RPC to also insert into program_waitlist
--   when a student is waitlisted. This bridges the enrollment and waitlist
--   tables so promote_from_waitlist can work correctly.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION enroll_student(
  p_program_id uuid,
  p_track_id uuid DEFAULT NULL,
  p_cohort_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enrollment_id uuid;
  v_program programs;
  v_cohort cohorts;
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

  -- Structured enrollment path: require cohort
  IF p_cohort_id IS NULL THEN
    RAISE EXCEPTION 'ENROLL_COHORT_REQUIRED';
  END IF;

  -- Lock and check cohort
  SELECT * INTO v_cohort FROM cohorts WHERE id = p_cohort_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ENROLL_COHORT_NOT_FOUND'; END IF;
  IF v_cohort.status != 'enrollment_open' THEN
    RAISE EXCEPTION 'ENROLL_COHORT_CLOSED';
  END IF;

  -- Check capacity (pending + active consume capacity)
  SELECT count(*) INTO v_current_count
  FROM enrollments
  WHERE cohort_id = p_cohort_id AND status IN ('pending', 'active');

  IF v_current_count >= v_cohort.max_students THEN
    v_status := 'waitlisted';
  ELSIF (v_program.settings->>'auto_approve')::boolean IS TRUE THEN
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO enrollments (student_id, program_id, track_id, cohort_id, teacher_id, status)
  VALUES (auth.uid(), p_program_id, p_track_id, p_cohort_id, v_cohort.teacher_id, v_status)
  RETURNING id INTO v_enrollment_id;

  -- If waitlisted, also insert into program_waitlist for tracking
  IF v_status = 'waitlisted' THEN
    -- Calculate next position in the waitlist
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_waitlist_position
    FROM program_waitlist
    WHERE cohort_id = p_cohort_id AND status = 'waiting';

    INSERT INTO program_waitlist (student_id, program_id, cohort_id, track_id, position)
    VALUES (auth.uid(), p_program_id, p_cohort_id, p_track_id, v_waitlist_position);
  END IF;

  RETURN v_enrollment_id;
END;
$$;
