-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00015_program_waitlist.sql
-- Feature: Waitlist management for structured programs (PRD Section 3.2)
-- Note: The enrollments table already has a 'waitlisted' status. This table
--   adds explicit waitlist tracking with position, notifications, and
--   auto-promotion when spots open up.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Section 1: CREATE program_waitlist table ───────────────────────────────

CREATE TABLE IF NOT EXISTS program_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_waitlist_status_check
    CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'cancelled')),
  CONSTRAINT program_waitlist_unique
    UNIQUE (student_id, cohort_id)
);

-- ─── Section 2: Indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_program_waitlist_cohort_id
  ON program_waitlist(cohort_id);

CREATE INDEX IF NOT EXISTS idx_program_waitlist_student_id
  ON program_waitlist(student_id);

CREATE INDEX IF NOT EXISTS idx_program_waitlist_status
  ON program_waitlist(status) WHERE status = 'waiting';

-- ─── Section 3: Trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at ON program_waitlist;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON program_waitlist
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Section 4: RPC — promote_from_waitlist ─────────────────────────────────

CREATE OR REPLACE FUNCTION promote_from_waitlist(p_cohort_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort cohorts;
  v_current_count INTEGER;
  v_available_spots INTEGER;
  v_promoted INTEGER := 0;
  v_waitlist RECORD;
BEGIN
  -- Lock cohort for atomic capacity check
  SELECT * INTO v_cohort FROM cohorts WHERE id = p_cohort_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Count current active + pending enrollments
  SELECT count(*) INTO v_current_count
  FROM enrollments
  WHERE cohort_id = p_cohort_id AND status IN ('pending', 'active');

  v_available_spots := v_cohort.max_students - v_current_count;
  IF v_available_spots <= 0 THEN RETURN 0; END IF;

  -- Promote waitlisted students in FIFO order
  FOR v_waitlist IN
    SELECT pw.id, pw.student_id, pw.program_id, pw.track_id
    FROM program_waitlist pw
    WHERE pw.cohort_id = p_cohort_id AND pw.status = 'waiting'
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
      AND cohort_id = p_cohort_id
      AND status = 'waitlisted';

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$$;

-- ─── Section 5: RLS Policies ────────────────────────────────────────────────

ALTER TABLE program_waitlist ENABLE ROW LEVEL SECURITY;

-- Students can read their own waitlist entries
CREATE POLICY "Students can read own waitlist"
  ON program_waitlist FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Students can cancel their own waitlist entry
CREATE POLICY "Students can cancel own waitlist"
  ON program_waitlist FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (status = 'cancelled');

-- Program staff can read waitlist for their program
CREATE POLICY "Program staff can read waitlist"
  ON program_waitlist FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = program_waitlist.program_id
        AND pr.role IN ('supervisor', 'program_admin')
    )
  );

-- Program admins can manage waitlist
CREATE POLICY "Program admins can manage waitlist"
  ON program_waitlist FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = program_waitlist.program_id
        AND pr.role = 'program_admin'
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = program_waitlist.program_id
        AND pr.role = 'program_admin'
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );

-- Admins can read all
CREATE POLICY "Admins can read all waitlist"
  ON program_waitlist FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );
