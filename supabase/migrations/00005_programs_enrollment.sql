-- =============================================================================
-- Migration: Programs & Enrollment
-- Feature: 003-programs-enrollment
-- Date: 2026-03-04
-- Description: Add 5 new tables (programs, program_tracks, cohorts,
--   enrollments, program_roles), helper functions, RLS policies,
--   indexes, and seed data for 8 programs + 25 tracks.
-- =============================================================================

-- =============================================================================
-- Section 1: Tables
-- =============================================================================

-- Table 1: programs (root table)
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT programs_category_check CHECK (category IN ('free', 'structured', 'mixed'))
);

-- Table 2: program_tracks
CREATE TABLE IF NOT EXISTS program_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  track_type TEXT,
  curriculum JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_tracks_track_type_check CHECK (track_type IS NULL OR track_type IN ('free', 'structured'))
);

-- Table 3: cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrollment_open',
  max_students INTEGER NOT NULL DEFAULT 30,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  meeting_link TEXT,
  schedule JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cohorts_status_check CHECK (status IN ('enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'archived')),
  CONSTRAINT cohorts_max_students_check CHECK (max_students > 0)
);

-- Table 4: enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_status_check CHECK (status IN ('pending', 'active', 'completed', 'dropped', 'waitlisted'))
);

-- Table 5: program_roles (no updated_at — immutable, delete and recreate)
CREATE TABLE IF NOT EXISTS program_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_roles_role_check CHECK (role IN ('program_admin', 'supervisor', 'teacher')),
  CONSTRAINT program_roles_unique UNIQUE (profile_id, program_id, role)
);

-- =============================================================================
-- Section 2: Triggers (reuse existing handle_updated_at from migration 00001)
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at ON programs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON program_tracks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON program_tracks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON cohorts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON enrollments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Section 3: Helper Functions
-- =============================================================================

-- get_user_programs(): returns array of program IDs the current user has access to
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

-- enroll_student(): atomic enrollment with capacity check and locking
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

  RETURN v_enrollment_id;
END;
$$;

-- =============================================================================
-- Section 4: Indexes
-- =============================================================================

-- programs
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs (is_active);
CREATE INDEX IF NOT EXISTS idx_programs_sort_order ON programs (sort_order);

-- program_tracks
CREATE INDEX IF NOT EXISTS idx_program_tracks_program_id ON program_tracks (program_id);
CREATE INDEX IF NOT EXISTS idx_program_tracks_sort_order ON program_tracks (program_id, sort_order);

-- cohorts
CREATE INDEX IF NOT EXISTS idx_cohorts_program_id ON cohorts (program_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_track_id ON cohorts (track_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts (status);
CREATE INDEX IF NOT EXISTS idx_cohorts_teacher_id ON cohorts (teacher_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON enrollments (program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON enrollments (cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments (status);

-- Functional unique index: prevents duplicate enrollments using COALESCE for nullable columns
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique_student_program
  ON enrollments (
    student_id,
    program_id,
    COALESCE(track_id, '00000000-0000-0000-0000-000000000000'),
    COALESCE(cohort_id, '00000000-0000-0000-0000-000000000000')
  );

-- program_roles
CREATE INDEX IF NOT EXISTS idx_program_roles_profile_id ON program_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_program_roles_program_id ON program_roles (program_id);

-- =============================================================================
-- Section 5: RLS Policies
-- =============================================================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_roles ENABLE ROW LEVEL SECURITY;

-- ─── programs RLS ────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'programs' AND policyname = 'Programs: authenticated read') THEN
    CREATE POLICY "Programs: authenticated read" ON programs
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'programs' AND policyname = 'Programs: master_admin insert') THEN
    CREATE POLICY "Programs: master_admin insert" ON programs
      FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'master_admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'programs' AND policyname = 'Programs: admin update') THEN
    CREATE POLICY "Programs: admin update" ON programs
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND id = ANY(get_user_programs()))
      );
  END IF;
END $$;

-- ─── program_tracks RLS ──────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_tracks' AND policyname = 'Tracks: authenticated read') THEN
    CREATE POLICY "Tracks: authenticated read" ON program_tracks
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_tracks' AND policyname = 'Tracks: admin insert') THEN
    CREATE POLICY "Tracks: admin insert" ON program_tracks
      FOR INSERT TO authenticated WITH CHECK (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_tracks' AND policyname = 'Tracks: admin update') THEN
    CREATE POLICY "Tracks: admin update" ON program_tracks
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

-- ─── cohorts RLS ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cohorts' AND policyname = 'Cohorts: authenticated read') THEN
    CREATE POLICY "Cohorts: authenticated read" ON cohorts
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cohorts' AND policyname = 'Cohorts: admin insert') THEN
    CREATE POLICY "Cohorts: admin insert" ON cohorts
      FOR INSERT TO authenticated WITH CHECK (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cohorts' AND policyname = 'Cohorts: admin update') THEN
    CREATE POLICY "Cohorts: admin update" ON cohorts
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

-- ─── enrollments RLS ─────────────────────────────────────────────────────────

-- SELECT: students see own, teachers see their cohorts, supervisors/admins see program-scoped
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: student read own') THEN
    CREATE POLICY "Enrollments: student read own" ON enrollments
      FOR SELECT TO authenticated USING (student_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: teacher read') THEN
    CREATE POLICY "Enrollments: teacher read" ON enrollments
      FOR SELECT TO authenticated USING (
        get_user_role() = 'teacher'
        AND (
          teacher_id = auth.uid()
          OR cohort_id IN (SELECT id FROM cohorts WHERE teacher_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: supervisor read') THEN
    CREATE POLICY "Enrollments: supervisor read" ON enrollments
      FOR SELECT TO authenticated USING (
        get_user_role() = 'supervisor'
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: program_admin read') THEN
    CREATE POLICY "Enrollments: program_admin read" ON enrollments
      FOR SELECT TO authenticated USING (
        get_user_role() = 'program_admin'
        AND program_id = ANY(get_user_programs())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: master_admin read') THEN
    CREATE POLICY "Enrollments: master_admin read" ON enrollments
      FOR SELECT TO authenticated USING (get_user_role() = 'master_admin');
  END IF;
END $$;

-- INSERT: students can insert own enrollments (free programs via direct insert)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: student insert') THEN
    CREATE POLICY "Enrollments: student insert" ON enrollments
      FOR INSERT TO authenticated WITH CHECK (
        student_id = auth.uid()
        AND get_user_role() = 'student'
      );
  END IF;
END $$;

-- UPDATE: students can only drop, admins can approve/reject/complete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: student update drop') THEN
    CREATE POLICY "Enrollments: student update drop" ON enrollments
      FOR UPDATE TO authenticated USING (
        student_id = auth.uid()
        AND get_user_role() = 'student'
      ) WITH CHECK (status = 'dropped');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Enrollments: admin update') THEN
    CREATE POLICY "Enrollments: admin update" ON enrollments
      FOR UPDATE TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

-- ─── program_roles RLS ───────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: read own') THEN
    CREATE POLICY "ProgramRoles: read own" ON program_roles
      FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: admin read') THEN
    CREATE POLICY "ProgramRoles: admin read" ON program_roles
      FOR SELECT TO authenticated USING (
        get_user_role() = 'master_admin'
        OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: program_admin insert') THEN
    CREATE POLICY "ProgramRoles: program_admin insert" ON program_roles
      FOR INSERT TO authenticated WITH CHECK (
        (
          get_user_role() = 'program_admin'
          AND program_id = ANY(get_user_programs())
          AND role IN ('teacher', 'supervisor')
          AND profile_id != auth.uid()
        )
        OR get_user_role() = 'master_admin'
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'program_roles' AND policyname = 'ProgramRoles: admin delete') THEN
    CREATE POLICY "ProgramRoles: admin delete" ON program_roles
      FOR DELETE TO authenticated USING (
        (
          get_user_role() = 'program_admin'
          AND program_id = ANY(get_user_programs())
          AND role IN ('teacher', 'supervisor')
        )
        OR get_user_role() = 'master_admin'
      );
  END IF;
END $$;

-- =============================================================================
-- Section 6: Seed Data (8 programs + 25 tracks)
-- =============================================================================

-- Programs
INSERT INTO programs (name, name_ar, description, description_ar, category, settings, sort_order) VALUES
  ('Alternating Recitation', 'تسميع بالتناوب', 'Drop-in recitation sessions with certified teachers, Quran and Mutoon recitation in a collaborative setting.', 'حلقات تسميع مع معلمين مجازين، تسميع القرآن والمتون في بيئة تعاونية.', 'mixed', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 1),
  ('Children''s Program', 'برنامج الأطفال', 'Structured Quran learning for children through Talqeen, Nooraniah method, and memorization tracks.', 'تعليم القرآن المنظّم للأطفال عبر مسارات التلقين والقاعدة النورانية والحفظ.', 'structured', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 2),
  ('Non-Arabic Speakers', 'برنامج الأعاجم', 'Free program for non-Arabic speakers to learn Quran recitation with specialized teachers.', 'برنامج مجاني لغير الناطقين بالعربية لتعلّم تلاوة القرآن مع معلمين متخصصين.', 'free', '{"max_students_per_teacher": 10, "auto_approve": true, "session_duration_minutes": 30}'::jsonb, 3),
  ('Qiraat Program', 'برنامج القراءات', 'Advanced recitation program covering multiple Qiraat traditions.', 'برنامج قراءات متقدّم يغطي عدة روايات.', 'structured', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 4),
  ('Mutoon Program', 'برنامج المتون', 'Islamic texts memorization program with both free and structured sections.', 'برنامج حفظ المتون الإسلامية بأقسام حرة ومنظّمة.', 'mixed', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 5),
  ('Arabic Language', 'برنامج اللغة العربية', 'Arabic grammar and language studies through classical texts.', 'دراسة النحو واللغة العربية من خلال المتون الكلاسيكية.', 'structured', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 6),
  ('Quran Memorization', 'برنامج حفظ القرآن الكريم', 'Comprehensive Quran memorization program with multiple intensity levels.', 'برنامج حفظ القرآن الشامل بمستويات متعددة.', 'structured', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 7),
  ('Himam Marathon', 'برنامج همم القرآني', 'Intensive Quran memorization marathon events with volume-based tracks.', 'ماراثونات حفظ القرآن المكثّفة بمسارات حسب عدد الأجزاء.', 'structured', '{"max_students_per_teacher": 10, "auto_approve": false, "session_duration_minutes": 30}'::jsonb, 8)
ON CONFLICT DO NOTHING;

-- Tracks: use CTEs to reference program IDs by sort_order
DO $$
DECLARE
  v_p1 UUID; v_p2 UUID; v_p4 UUID; v_p5 UUID;
  v_p6 UUID; v_p7 UUID; v_p8 UUID;
BEGIN
  SELECT id INTO v_p1 FROM programs WHERE sort_order = 1;
  SELECT id INTO v_p2 FROM programs WHERE sort_order = 2;
  SELECT id INTO v_p4 FROM programs WHERE sort_order = 4;
  SELECT id INTO v_p5 FROM programs WHERE sort_order = 5;
  SELECT id INTO v_p6 FROM programs WHERE sort_order = 6;
  SELECT id INTO v_p7 FROM programs WHERE sort_order = 7;
  SELECT id INTO v_p8 FROM programs WHERE sort_order = 8;

  -- Program 1: Alternating Recitation (mixed — all tracks free)
  INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order) VALUES
    (v_p1, 'Sessions with Certified Teachers', 'حلقات مع معلمين مجازين', 'free', 1),
    (v_p1, 'Quran Recitation', 'تسميع قرآن', 'free', 2),
    (v_p1, 'Mutoon Recitation', 'تسميع متون', 'free', 3)
  ON CONFLICT DO NOTHING;

  -- Program 2: Children's Program (structured)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order) VALUES
    (v_p2, 'Talqeen', 'التلقين', 1),
    (v_p2, 'Nooraniah Method', 'القاعدة النورانية', 2),
    (v_p2, 'Memorization Track', 'مسار الحفظ', 3)
  ON CONFLICT DO NOTHING;

  -- Program 4: Qiraat (structured)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order) VALUES
    (v_p4, 'Hafs from Asim', 'حفص عن عاصم', 1),
    (v_p4, 'Warsh from Nafi', 'ورش عن نافع', 2),
    (v_p4, 'Qalun from Nafi', 'قالون عن نافع', 3)
  ON CONFLICT DO NOTHING;

  -- Program 5: Mutoon (mixed — 1 free + 3 structured)
  INSERT INTO program_tracks (program_id, name, name_ar, track_type, sort_order) VALUES
    (v_p5, 'Free Section', 'قسم حر', 'free', 1),
    (v_p5, 'Tuhfat Al-Atfal', 'تحفة الأطفال', 'structured', 2),
    (v_p5, 'Al-Jazariyyah', 'الجزرية', 'structured', 3),
    (v_p5, 'Al-Shatibiyyah', 'الشاطبية', 'structured', 4)
  ON CONFLICT DO NOTHING;

  -- Program 6: Arabic Language (structured)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order) VALUES
    (v_p6, 'Al-Ajrumiyyah', 'الآجرومية', 1),
    (v_p6, 'Qatr Al-Nada', 'قطر الندى', 2)
  ON CONFLICT DO NOTHING;

  -- Program 7: Quran Memorization (structured)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order) VALUES
    (v_p7, 'Mateen 10 Juz''', 'متين ١٠ أجزاء', 1),
    (v_p7, 'Mateen 15 Juz''', 'متين ١٥ جزء', 2),
    (v_p7, 'Mateen 30 Juz''', 'متين ٣٠ جزء', 3),
    (v_p7, 'Thabbitha', 'ثبتها', 4),
    (v_p7, 'Itqan', 'الإتقان', 5)
  ON CONFLICT DO NOTHING;

  -- Program 8: Himam Marathon (structured — by volume)
  INSERT INTO program_tracks (program_id, name, name_ar, sort_order) VALUES
    (v_p8, '3 Juz''', '٣ أجزاء', 1),
    (v_p8, '5 Juz''', '٥ أجزاء', 2),
    (v_p8, '10 Juz''', '١٠ أجزاء', 3),
    (v_p8, '15 Juz''', '١٥ جزء', 4),
    (v_p8, '30 Juz''', '٣٠ جزء', 5)
  ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 8. REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE programs;
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;
