-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00013_student_guardians.sql
-- Feature: Guardian metadata for children's program (PRD Section 2.3)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Section 1: CREATE student_guardians table ──────────────────────────────

CREATE TABLE IF NOT EXISTS student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT,
  guardian_email TEXT,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_guardians_relationship_check
    CHECK (relationship IN ('parent', 'guardian', 'sibling', 'other'))
);

-- ─── Section 2: Indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id
  ON student_guardians(student_id);

-- Only one primary guardian per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_guardians_primary
  ON student_guardians(student_id) WHERE is_primary = true;

-- ─── Section 3: Trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at ON student_guardians;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON student_guardians
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Section 4: RLS Policies ────────────────────────────────────────────────

ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;

-- Students can read their own guardians
CREATE POLICY "Students can read own guardians"
  ON student_guardians FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Parents can read guardians of their children
CREATE POLICY "Parents can read child guardians"
  ON student_guardians FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_guardians.student_id
        AND s.parent_id = auth.uid()
    )
  );

-- Teachers/supervisors can read guardians of students in their scope
CREATE POLICY "Staff can read student guardians"
  ON student_guardians FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN program_roles pr ON pr.program_id = e.program_id
      WHERE e.student_id = student_guardians.student_id
        AND pr.profile_id = auth.uid()
        AND pr.role IN ('teacher', 'supervisor', 'program_admin')
    )
  );

-- Admins can read all
CREATE POLICY "Admins can read all guardians"
  ON student_guardians FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );

-- Admins and program admins can insert/update
CREATE POLICY "Admins can manage guardians"
  ON student_guardians FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );
