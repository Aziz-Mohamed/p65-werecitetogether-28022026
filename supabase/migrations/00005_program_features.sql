-- =============================================================================
-- WeReciteTogether — Program-Specific Features Migration
-- =============================================================================
-- Creates 8 new tables, 2 database functions, 1 sequence, RLS policies,
-- triggers, and a storage bucket for the program-features module.
-- Adds peer_available column to profiles table.
-- =============================================================================

-- =============================================================================
-- Section 1: ALTER existing tables
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS peer_available BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- Section 2: Sequences
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS cert_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Section 3: Tables (8 new tables in FK dependency order)
-- =============================================================================

-- Table 1: certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ijazah', 'graduation', 'completion', 'participation')),
  status TEXT NOT NULL DEFAULT 'recommended'
    CHECK (status IN ('recommended', 'supervisor_approved', 'issued', 'rejected', 'revoked')),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  certificate_number TEXT UNIQUE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  recommended_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  chain_of_narration TEXT,
  rejection_reason TEXT,
  revocation_reason TEXT,
  revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  issue_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Conditional NOT NULL constraints
  CHECK (status != 'rejected' OR rejection_reason IS NOT NULL),
  CHECK (status != 'revoked' OR revocation_reason IS NOT NULL)
);

CREATE INDEX idx_certifications_student_program ON certifications (student_id, program_id);
CREATE INDEX idx_certifications_status ON certifications (status);
CREATE INDEX idx_certifications_cert_number ON certifications (certificate_number) WHERE certificate_number IS NOT NULL;

CREATE TRIGGER set_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 2: himam_events
CREATE TABLE himam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '05:00',
  end_time TIME NOT NULL DEFAULT '05:00',
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- event_date must be a Saturday (DOW: 0=Sun, 1=Mon, ..., 6=Sat)
  CHECK (EXTRACT(DOW FROM event_date) = 6)
);

CREATE INDEX idx_himam_events_program_date ON himam_events (program_id, event_date);
CREATE INDEX idx_himam_events_status ON himam_events (status);

CREATE TRIGGER set_himam_events_updated_at
  BEFORE UPDATE ON himam_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 3: himam_registrations
CREATE TABLE himam_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES himam_events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')),
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'paired', 'in_progress', 'completed', 'incomplete', 'cancelled')),
  time_slots JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, student_id)
);

CREATE INDEX idx_himam_registrations_event_student ON himam_registrations (event_id, student_id);
CREATE INDEX idx_himam_registrations_event_track ON himam_registrations (event_id, track, status);

CREATE TRIGGER set_himam_registrations_updated_at
  BEFORE UPDATE ON himam_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 4: himam_progress
CREATE TABLE himam_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES himam_registrations(id) ON DELETE CASCADE,
  juz_number INT NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'partner_absent')),
  completed_at TIMESTAMPTZ,
  logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (registration_id, juz_number)
);

CREATE INDEX idx_himam_progress_registration ON himam_progress (registration_id);

-- Table 5: curriculum_progress
CREATE TABLE curriculum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  progress_type TEXT NOT NULL CHECK (progress_type IN ('mutoon', 'qiraat', 'arabic')),
  section_number INT NOT NULL,
  section_title TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'memorized', 'certified', 'passed', 'failed')),
  score NUMERIC(5,2),
  teacher_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, section_number)
);

CREATE INDEX idx_curriculum_progress_enrollment ON curriculum_progress (enrollment_id, section_number);
CREATE INDEX idx_curriculum_progress_student_program ON curriculum_progress (student_id, program_id);
CREATE INDEX idx_curriculum_progress_type_status ON curriculum_progress (progress_type, status);

CREATE TRIGGER set_curriculum_progress_updated_at
  BEFORE UPDATE ON curriculum_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 6: student_guardians
CREATE TABLE student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT,
  guardian_email TEXT,
  relationship TEXT NOT NULL DEFAULT 'parent'
    CHECK (relationship IN ('parent', 'guardian', 'grandparent', 'sibling', 'other')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (guardian_phone IS NOT NULL OR guardian_email IS NOT NULL)
);

CREATE INDEX idx_student_guardians_student ON student_guardians (student_id);

CREATE TRIGGER set_student_guardians_updated_at
  BEFORE UPDATE ON student_guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 7: guardian_notification_preferences
CREATE TABLE guardian_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES student_guardians(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guardian_id, category)
);

-- Table 8: peer_pairings
CREATE TABLE peer_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('quran', 'mutoon')),
  student_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  session_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_peer_pairings_program_status ON peer_pairings (program_id, status);
CREATE INDEX idx_peer_pairings_student_a ON peer_pairings (student_a_id);
CREATE INDEX idx_peer_pairings_student_b ON peer_pairings (student_b_id);

CREATE TRIGGER set_peer_pairings_updated_at
  BEFORE UPDATE ON peer_pairings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Section 4: Database Functions
-- =============================================================================

-- Generate certificate numbers: WRT-YYYY-NNNNN
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'issued' AND NEW.certificate_number IS NULL THEN
    NEW.certificate_number := 'WRT-' || EXTRACT(YEAR FROM COALESCE(NEW.issue_date, CURRENT_DATE))::TEXT
      || '-' || LPAD(nextval('cert_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_certificate_number
  BEFORE INSERT OR UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION generate_certificate_number();

-- Check certification eligibility for a given enrollment
CREATE OR REPLACE FUNCTION get_certification_eligibility(p_enrollment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress_type TEXT;
  v_total INT;
  v_completed INT;
  v_eligible BOOLEAN;
  v_passing_score NUMERIC;
BEGIN
  -- Determine progress type from the first row
  SELECT progress_type INTO v_progress_type
  FROM curriculum_progress
  WHERE enrollment_id = p_enrollment_id
  LIMIT 1;

  IF v_progress_type IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'total_sections', 0, 'completed_sections', 0, 'progress_type', NULL);
  END IF;

  -- Count total sections
  SELECT COUNT(*) INTO v_total
  FROM curriculum_progress
  WHERE enrollment_id = p_enrollment_id;

  -- Count completed sections based on progress type
  IF v_progress_type = 'mutoon' THEN
    SELECT COUNT(*) INTO v_completed
    FROM curriculum_progress
    WHERE enrollment_id = p_enrollment_id
      AND status IN ('memorized', 'certified');
  ELSIF v_progress_type = 'qiraat' THEN
    SELECT COUNT(*) INTO v_completed
    FROM curriculum_progress
    WHERE enrollment_id = p_enrollment_id
      AND status = 'passed';
  ELSIF v_progress_type = 'arabic' THEN
    -- Get passing score from track curriculum metadata (default 60)
    SELECT COALESCE(
      (pt.curriculum->>'passing_score')::NUMERIC,
      60
    ) INTO v_passing_score
    FROM curriculum_progress cp
    JOIN enrollments e ON e.id = cp.enrollment_id
    JOIN program_tracks pt ON pt.id = e.track_id
    WHERE cp.enrollment_id = p_enrollment_id
    LIMIT 1;

    SELECT COUNT(*) INTO v_completed
    FROM curriculum_progress
    WHERE enrollment_id = p_enrollment_id
      AND status IN ('passed')
      AND score >= v_passing_score;
  END IF;

  v_eligible := (v_total > 0 AND v_completed = v_total);

  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'total_sections', v_total,
    'completed_sections', v_completed,
    'progress_type', v_progress_type
  );
END;
$$;

-- Auto-cancel certifications when enrollment is deleted/deactivated
CREATE OR REPLACE FUNCTION auto_cancel_certifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On DELETE or status change away from active
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status NOT IN ('active', 'approved')) THEN
    UPDATE certifications
    SET status = 'rejected',
        rejection_reason = 'Auto-cancelled: student enrollment was removed or deactivated'
    WHERE enrollment_id = COALESCE(OLD.id, NEW.id)
      AND status IN ('recommended', 'supervisor_approved');
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_cancel_certifications
  AFTER DELETE OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION auto_cancel_certifications();

-- Auto-cancel peer pairings when enrollment is deleted
CREATE OR REPLACE FUNCTION auto_cancel_peer_pairings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE peer_pairings
  SET status = 'cancelled'
  WHERE (student_a_id = OLD.student_id OR student_b_id = OLD.student_id)
    AND program_id = OLD.program_id
    AND status IN ('pending', 'active');

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_auto_cancel_peer_pairings
  AFTER DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION auto_cancel_peer_pairings();

-- =============================================================================
-- Section 5: Row Level Security
-- =============================================================================

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE himam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE himam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE himam_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_pairings ENABLE ROW LEVEL SECURITY;

-- ─── certifications ────────────────────────────────────────────────────────
-- Students: read own issued/revoked only
CREATE POLICY certifications_student_select ON certifications
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    AND status IN ('issued', 'revoked')
  );

-- Teachers: read/recommend for their program students
CREATE POLICY certifications_teacher_select ON certifications
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'teacher'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY certifications_teacher_insert ON certifications
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'teacher'
    AND program_id = ANY(get_user_programs())
    AND recommended_by = auth.uid()
    AND status = 'recommended'
  );

-- Supervisors: read/approve in their programs
CREATE POLICY certifications_supervisor_select ON certifications
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'supervisor'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY certifications_supervisor_update ON certifications
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'supervisor'
    AND program_id = ANY(get_user_programs())
    AND status = 'recommended'
  );

-- Program admins: full CRUD in their programs
CREATE POLICY certifications_admin_select ON certifications
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY certifications_admin_update ON certifications
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

-- Master admin: full read
CREATE POLICY certifications_master_select ON certifications
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- ─── himam_events ──────────────────────────────────────────────────────────
-- All authenticated users can read events
CREATE POLICY himam_events_select ON himam_events
  FOR SELECT TO authenticated
  USING (true);

-- Program admins: full CRUD
CREATE POLICY himam_events_admin_insert ON himam_events
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY himam_events_admin_update ON himam_events
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY himam_events_admin_delete ON himam_events
  FOR DELETE TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

-- ─── himam_registrations ───────────────────────────────────────────────────
-- Students: own CRUD
CREATE POLICY himam_registrations_student_select ON himam_registrations
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY himam_registrations_student_insert ON himam_registrations
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY himam_registrations_student_update ON himam_registrations
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

-- Staff: read in program
CREATE POLICY himam_registrations_staff_select ON himam_registrations
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('teacher', 'supervisor', 'program_admin')
    AND EXISTS (
      SELECT 1 FROM himam_events he
      WHERE he.id = himam_registrations.event_id
        AND he.program_id = ANY(get_user_programs())
    )
  );

-- Program admins: full CRUD
CREATE POLICY himam_registrations_admin_all ON himam_registrations
  FOR ALL TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND EXISTS (
      SELECT 1 FROM himam_events he
      WHERE he.id = himam_registrations.event_id
        AND he.program_id = ANY(get_user_programs())
    )
  );

-- Master admin: full read
CREATE POLICY himam_registrations_master_select ON himam_registrations
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- ─── himam_progress ────────────────────────────────────────────────────────
-- Students: own read + log (via registration ownership)
CREATE POLICY himam_progress_student_select ON himam_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM himam_registrations hr
      WHERE hr.id = himam_progress.registration_id
        AND (hr.student_id = auth.uid() OR hr.partner_id = auth.uid())
    )
  );

CREATE POLICY himam_progress_student_update ON himam_progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM himam_registrations hr
      WHERE hr.id = himam_progress.registration_id
        AND (hr.student_id = auth.uid() OR hr.partner_id = auth.uid())
    )
  );

-- Staff: read in program
CREATE POLICY himam_progress_staff_select ON himam_progress
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('teacher', 'supervisor', 'program_admin')
    AND EXISTS (
      SELECT 1 FROM himam_registrations hr
      JOIN himam_events he ON he.id = hr.event_id
      WHERE hr.id = himam_progress.registration_id
        AND he.program_id = ANY(get_user_programs())
    )
  );

-- Master admin: full read
CREATE POLICY himam_progress_master_select ON himam_progress
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- ─── curriculum_progress ───────────────────────────────────────────────────
-- Students: read own
CREATE POLICY curriculum_progress_student_select ON curriculum_progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers: read/update for students in their programs
CREATE POLICY curriculum_progress_teacher_select ON curriculum_progress
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'teacher'
    AND program_id = ANY(get_user_programs())
  );

CREATE POLICY curriculum_progress_teacher_update ON curriculum_progress
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'teacher'
    AND program_id = ANY(get_user_programs())
  );

-- Supervisors/admins: read in program
CREATE POLICY curriculum_progress_staff_select ON curriculum_progress
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('supervisor', 'program_admin')
    AND program_id = ANY(get_user_programs())
  );

-- Master admin: full read
CREATE POLICY curriculum_progress_master_select ON curriculum_progress
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- Service role needs INSERT for initializeProgress
CREATE POLICY curriculum_progress_service_insert ON curriculum_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Teachers can initialize progress for students in their programs
    (get_user_role() = 'teacher' AND program_id = ANY(get_user_programs()))
    -- Program admins can also initialize
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

-- ─── student_guardians ─────────────────────────────────────────────────────
-- Students: own CRUD
CREATE POLICY student_guardians_student_select ON student_guardians
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY student_guardians_student_insert ON student_guardians
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY student_guardians_student_update ON student_guardians
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY student_guardians_student_delete ON student_guardians
  FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- Teachers: read for their program students
CREATE POLICY student_guardians_teacher_select ON student_guardians
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = student_guardians.student_id
        AND e.program_id = ANY(get_user_programs())
        AND e.status IN ('active', 'approved')
    )
  );

-- Supervisors/admins: read in program
CREATE POLICY student_guardians_staff_select ON student_guardians
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('supervisor', 'program_admin')
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = student_guardians.student_id
        AND e.program_id = ANY(get_user_programs())
        AND e.status IN ('active', 'approved')
    )
  );

-- Master admin: full read
CREATE POLICY student_guardians_master_select ON student_guardians
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- ─── guardian_notification_preferences ──────────────────────────────────────
-- Students: own CRUD (via guardian ownership)
CREATE POLICY gnp_student_select ON guardian_notification_preferences
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_guardians sg
      WHERE sg.id = guardian_notification_preferences.guardian_id
        AND sg.student_id = auth.uid()
    )
  );

CREATE POLICY gnp_student_insert ON guardian_notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_guardians sg
      WHERE sg.id = guardian_notification_preferences.guardian_id
        AND sg.student_id = auth.uid()
    )
  );

CREATE POLICY gnp_student_update ON guardian_notification_preferences
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_guardians sg
      WHERE sg.id = guardian_notification_preferences.guardian_id
        AND sg.student_id = auth.uid()
    )
  );

CREATE POLICY gnp_student_delete ON guardian_notification_preferences
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_guardians sg
      WHERE sg.id = guardian_notification_preferences.guardian_id
        AND sg.student_id = auth.uid()
    )
  );

-- Master admin: full read
CREATE POLICY gnp_master_select ON guardian_notification_preferences
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- ─── peer_pairings ─────────────────────────────────────────────────────────
-- Students: own CRUD (participant in pairing)
CREATE POLICY peer_pairings_student_select ON peer_pairings
  FOR SELECT TO authenticated
  USING (student_a_id = auth.uid() OR student_b_id = auth.uid());

CREATE POLICY peer_pairings_student_insert ON peer_pairings
  FOR INSERT TO authenticated
  WITH CHECK (student_a_id = auth.uid());

CREATE POLICY peer_pairings_student_update ON peer_pairings
  FOR UPDATE TO authenticated
  USING (student_a_id = auth.uid() OR student_b_id = auth.uid());

-- Program admins: read in program
CREATE POLICY peer_pairings_admin_select ON peer_pairings
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'program_admin'
    AND program_id = ANY(get_user_programs())
  );

-- Master admin: full read
CREATE POLICY peer_pairings_master_select ON peer_pairings
  FOR SELECT TO authenticated
  USING (is_master_admin());

-- =============================================================================
-- Section 6: Realtime (enable for tables that need live updates)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE himam_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE curriculum_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE peer_pairings;

-- =============================================================================
-- Section 7: Storage
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: students can upload their own certificates
CREATE POLICY certificates_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Storage policy: public read for certificate images
CREATE POLICY certificates_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'certificates');
