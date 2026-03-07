-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00014_mutoon_progress.sql
-- Feature: Mutoon text memorization progress tracking (PRD Section 3.5)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Section 1: CREATE mutoon_progress table ────────────────────────────────

CREATE TABLE IF NOT EXISTS mutoon_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  track_id UUID NOT NULL REFERENCES program_tracks(id) ON DELETE RESTRICT,
  -- Line-level tracking: which line of the text the student has reached
  current_line INTEGER NOT NULL DEFAULT 0,
  total_lines INTEGER NOT NULL DEFAULT 1,
  -- Memorization quality
  last_reviewed_at TIMESTAMPTZ,
  review_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  certified_at TIMESTAMPTZ,
  certified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mutoon_progress_status_check
    CHECK (status IN ('in_progress', 'completed', 'certified')),
  CONSTRAINT mutoon_progress_unique
    UNIQUE (student_id, track_id)
);

-- ─── Section 2: Indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mutoon_progress_student_id
  ON mutoon_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_mutoon_progress_program_id
  ON mutoon_progress(program_id);

CREATE INDEX IF NOT EXISTS idx_mutoon_progress_track_id
  ON mutoon_progress(track_id);

-- ─── Section 3: Trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at ON mutoon_progress;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON mutoon_progress
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Section 4: RLS Policies ────────────────────────────────────────────────

ALTER TABLE mutoon_progress ENABLE ROW LEVEL SECURITY;

-- Students can read their own progress
CREATE POLICY "Students can read own mutoon progress"
  ON mutoon_progress FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Students can update their own progress (line advancement)
CREATE POLICY "Students can update own mutoon progress"
  ON mutoon_progress FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Program staff can read progress for their program
CREATE POLICY "Program staff can read mutoon progress"
  ON mutoon_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = mutoon_progress.program_id
        AND pr.role IN ('teacher', 'supervisor', 'program_admin')
    )
  );

-- Teachers can update/certify student progress
CREATE POLICY "Teachers can update mutoon progress"
  ON mutoon_progress FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles pr
      WHERE pr.profile_id = auth.uid()
        AND pr.program_id = mutoon_progress.program_id
        AND pr.role = 'teacher'
    )
  );

-- Admins can read all
CREATE POLICY "Admins can read all mutoon progress"
  ON mutoon_progress FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );

-- Insert: students can create their own progress when enrolled
CREATE POLICY "Students can create own mutoon progress"
  ON mutoon_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = auth.uid()
        AND e.program_id = mutoon_progress.program_id
        AND e.status = 'active'
    )
  );
