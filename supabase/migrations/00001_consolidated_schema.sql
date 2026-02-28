-- =============================================================================
-- WeReciteTogether — Consolidated Schema Migration
-- =============================================================================
-- This single migration creates the entire database schema from scratch.
-- It includes: extensions, helper functions, tables, indexes, RLS policies,
-- triggers, realtime publication, and storage configuration.
-- =============================================================================

-- =============================================================================
-- Section 1: Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA cron;

-- =============================================================================
-- Section 2: Shared Functions (before tables that reference them)
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Section 3: Tables (19 tables in FK dependency order)
-- =============================================================================

-- Table 1: platform_config (singleton)
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'WeReciteTogether',
  name_ar TEXT NOT NULL DEFAULT 'نتلو معاً',
  description TEXT,
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{
    "maintenance_mode": false,
    "default_language": "ar",
    "support_email": "support@werecitetogether.com",
    "terms_url": "",
    "privacy_url": "",
    "min_app_version": "1.0.0",
    "max_voice_memo_seconds": 120,
    "default_queue_expiry_minutes": 120,
    "default_waitlist_offer_hours": 24
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_platform_config_updated_at
  BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 2: profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher', 'supervisor', 'program_admin', 'master_admin')),
  full_name TEXT NOT NULL DEFAULT '',
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  age_range TEXT CHECK (age_range IN ('under_13', '13_17', '18_25', '26_35', '36_50', '50_plus')),
  country TEXT NOT NULL DEFAULT '',
  region TEXT,
  meeting_link TEXT,
  meeting_platform TEXT CHECK (meeting_platform IN ('google_meet', 'zoom', 'jitsi', 'other')),
  bio TEXT,
  languages TEXT[],
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_active ON profiles (id) WHERE is_active = true;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 3: programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL CHECK (category IN ('free', 'structured', 'mixed')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{
    "max_students_per_teacher": 10,
    "max_daily_free_sessions": 2,
    "queue_expiry_minutes": 120,
    "waitlist_offer_hours": 24,
    "notify_teachers_queue_threshold": 5,
    "enrollment_auto_approve": false,
    "min_reviews_for_display": 5,
    "good_standing_threshold": 4.0,
    "warning_threshold": 3.5,
    "concern_threshold": 3.0,
    "review_window_hours": 48
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 4: program_tracks
CREATE TABLE program_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  track_type TEXT CHECK (track_type IN ('free', 'structured')),
  curriculum JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 5: program_roles (junction — profiles ↔ programs)
CREATE TABLE program_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('program_admin', 'supervisor', 'teacher')),
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, program_id, role)
);

CREATE INDEX idx_program_roles_lookup ON program_roles (profile_id, program_id);

-- Table 6: cohorts
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrollment_open'
    CHECK (status IN ('enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'archived')),
  max_students INT NOT NULL DEFAULT 30 CHECK (max_students > 0),
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  meeting_link TEXT,
  schedule JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 7: enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'active', 'completed', 'dropped', 'waitlisted')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index: prevent duplicate active enrollments (allow re-enrollment after drop/complete)
CREATE UNIQUE INDEX idx_enrollments_active_unique
  ON enrollments (student_id, program_id, track_id, cohort_id)
  WHERE status NOT IN ('dropped', 'completed');

CREATE INDEX idx_enrollments_student_status ON enrollments (student_id, status);
CREATE INDEX idx_enrollments_program_status ON enrollments (program_id, status);

CREATE TRIGGER set_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 8: teacher_availability
CREATE TABLE teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  available_since TIMESTAMPTZ,
  max_concurrent_students INT NOT NULL DEFAULT 1 CHECK (max_concurrent_students > 0),
  current_session_count INT NOT NULL DEFAULT 0 CHECK (current_session_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, program_id)
);

CREATE INDEX idx_teacher_availability_available
  ON teacher_availability (program_id)
  WHERE is_available = true;

CREATE TRIGGER set_teacher_availability_updated_at
  BEFORE UPDATE ON teacher_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 9: sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'completed', 'cancelled')),
  meeting_link_used TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_minutes INT CHECK (duration_minutes > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_teacher_status ON sessions (teacher_id, status);
CREATE INDEX idx_sessions_program_date ON sessions (program_id, created_at);

CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 10: session_attendance
CREATE TABLE session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INT CHECK (score >= 0 AND score <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

-- Table 11: session_voice_memos
CREATE TABLE session_voice_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 1 AND duration_seconds <= 120),
  file_size_bytes INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE (session_id, student_id)
);

CREATE INDEX idx_voice_memos_expires ON session_voice_memos (expires_at);

-- Table 12: teacher_reviews
CREATE TABLE teacher_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  comment TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  excluded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  exclusion_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, session_id)
);

CREATE INDEX idx_reviews_teacher_program ON teacher_reviews (teacher_id, program_id, is_excluded);

-- Table 13: teacher_rating_stats (materialized aggregate)
CREATE TABLE teacher_rating_stats (
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  total_reviews INT NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  rating_1_count INT NOT NULL DEFAULT 0,
  rating_2_count INT NOT NULL DEFAULT 0,
  rating_3_count INT NOT NULL DEFAULT 0,
  rating_4_count INT NOT NULL DEFAULT 0,
  rating_5_count INT NOT NULL DEFAULT 0,
  common_positive_tags TEXT[],
  common_constructive_tags TEXT[],
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, program_id)
);

-- Table 14: free_program_queue
CREATE TABLE free_program_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  position INT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'claimed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Partial unique: one active queue entry per student per program
CREATE UNIQUE INDEX idx_queue_active_unique
  ON free_program_queue (student_id, program_id)
  WHERE status IN ('waiting', 'notified');

CREATE INDEX idx_queue_program_status ON free_program_queue (program_id, status);

-- Table 15: daily_session_count
CREATE TABLE daily_session_count (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INT NOT NULL DEFAULT 0,
  UNIQUE (student_id, program_id, date)
);

-- Table 16: program_waitlist
CREATE TABLE program_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  track_id UUID REFERENCES program_tracks(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position INT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'cancelled')),
  offer_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_program_waitlist_updated_at
  BEFORE UPDATE ON program_waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table 17: session_schedules
CREATE TABLE session_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 18: notification_preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, category)
);

-- Table 19: push_tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, token)
);

CREATE TRIGGER set_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Section 4: RLS Helper Functions
-- =============================================================================

-- Returns the global role from profiles table
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Returns program IDs the user has access to
-- Teachers/supervisors/program_admins: from program_roles
-- Students: from active enrollments
-- Master admins: returns NULL (bypass)
CREATE OR REPLACE FUNCTION get_user_programs()
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  program_ids UUID[];
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();

  IF user_role = 'master_admin' THEN
    RETURN NULL; -- NULL = bypass all program scoping
  END IF;

  IF user_role = 'student' THEN
    SELECT array_agg(DISTINCT program_id) INTO program_ids
    FROM enrollments
    WHERE student_id = auth.uid()
      AND status IN ('active', 'approved', 'pending');
  ELSE
    SELECT array_agg(DISTINCT program_id) INTO program_ids
    FROM program_roles
    WHERE profile_id = auth.uid();
  END IF;

  RETURN COALESCE(program_ids, ARRAY[]::UUID[]);
END;
$$;

-- Convenience check for master admin
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'
  );
$$;

-- =============================================================================
-- Section 5: RLS Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_program_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_session_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ─── platform_config ─────────────────────────────────────────────────────────
CREATE POLICY platform_config_select ON platform_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY platform_config_update ON platform_config
  FOR UPDATE TO authenticated USING (is_master_admin());
CREATE POLICY platform_config_insert ON platform_config
  FOR INSERT TO authenticated WITH CHECK (is_master_admin());

-- ─── profiles ────────────────────────────────────────────────────────────────
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR is_master_admin());
CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR is_master_admin());

-- Allow teachers/supervisors/admins to see profiles in their programs
CREATE POLICY profiles_select_program_staff ON profiles
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('teacher', 'supervisor', 'program_admin')
    AND (
      -- Students enrolled in their programs
      EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.student_id = profiles.id
          AND e.program_id = ANY(get_user_programs())
          AND e.status IN ('active', 'approved', 'pending')
      )
      -- Or staff in their programs
      OR EXISTS (
        SELECT 1 FROM program_roles pr
        WHERE pr.profile_id = profiles.id
          AND pr.program_id = ANY(get_user_programs())
      )
    )
  );

-- ─── programs ────────────────────────────────────────────────────────────────
CREATE POLICY programs_select ON programs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY programs_insert ON programs
  FOR INSERT TO authenticated WITH CHECK (is_master_admin());
CREATE POLICY programs_update ON programs
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND id = ANY(get_user_programs()))
  );

-- ─── program_tracks ──────────────────────────────────────────────────────────
CREATE POLICY program_tracks_select ON program_tracks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY program_tracks_insert ON program_tracks
  FOR INSERT TO authenticated
  WITH CHECK (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY program_tracks_update ON program_tracks
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

-- ─── program_roles ───────────────────────────────────────────────────────────
CREATE POLICY program_roles_select ON program_roles
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY program_roles_insert ON program_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY program_roles_update ON program_roles
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY program_roles_delete ON program_roles
  FOR DELETE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

-- ─── cohorts ─────────────────────────────────────────────────────────────────
CREATE POLICY cohorts_select ON cohorts
  FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR get_user_programs() IS NULL
    OR program_id = ANY(get_user_programs())
  );
CREATE POLICY cohorts_insert ON cohorts
  FOR INSERT TO authenticated
  WITH CHECK (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY cohorts_update ON cohorts
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

-- ─── enrollments ─────────────────────────────────────────────────────────────
CREATE POLICY enrollments_select ON enrollments
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR is_master_admin()
    OR (get_user_role() IN ('teacher', 'supervisor', 'program_admin')
        AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY enrollments_insert ON enrollments
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR is_master_admin());
CREATE POLICY enrollments_update ON enrollments
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
    OR (get_user_role() = 'teacher' AND teacher_id = auth.uid())
  );

-- ─── teacher_availability ────────────────────────────────────────────────────
CREATE POLICY teacher_availability_select ON teacher_availability
  FOR SELECT TO authenticated USING (true);
CREATE POLICY teacher_availability_insert ON teacher_availability
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
CREATE POLICY teacher_availability_update ON teacher_availability
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY teacher_availability_delete ON teacher_availability
  FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- ─── sessions ────────────────────────────────────────────────────────────────
CREATE POLICY sessions_select ON sessions
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR is_master_admin()
    OR EXISTS (
      SELECT 1 FROM session_attendance sa WHERE sa.session_id = id AND sa.student_id = auth.uid()
    )
    OR (get_user_role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM cohorts c WHERE c.id = cohort_id AND c.supervisor_id = auth.uid()
    ))
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY sessions_insert ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('teacher', 'master_admin'));
CREATE POLICY sessions_update ON sessions
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR is_master_admin());

-- ─── session_attendance ──────────────────────────────────────────────────────
CREATE POLICY session_attendance_select ON session_attendance
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR is_master_admin()
    OR EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN cohorts c ON c.id = s.cohort_id
      WHERE s.id = session_id AND c.supervisor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id AND s.program_id = ANY(get_user_programs())
        AND get_user_role() = 'program_admin'
    )
  );
CREATE POLICY session_attendance_insert ON session_attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
  );
CREATE POLICY session_attendance_update ON session_attendance
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = session_id AND s.teacher_id = auth.uid()
    )
  );

-- ─── session_voice_memos ─────────────────────────────────────────────────────
CREATE POLICY voice_memos_select ON session_voice_memos
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR student_id = auth.uid()
    OR is_master_admin()
    OR (get_user_role() = 'supervisor' AND EXISTS (
      SELECT 1 FROM sessions s
      JOIN cohorts c ON c.id = s.cohort_id
      WHERE s.id = session_id AND c.supervisor_id = auth.uid()
    ))
  );
CREATE POLICY voice_memos_insert ON session_voice_memos
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- ─── teacher_reviews ─────────────────────────────────────────────────────────
-- Students see own reviews
CREATE POLICY teacher_reviews_student_select ON teacher_reviews
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers see reviews about them (student_id masked at app layer)
CREATE POLICY teacher_reviews_teacher_select ON teacher_reviews
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

-- Supervisors see reviews in their cohorts
CREATE POLICY teacher_reviews_supervisor_select ON teacher_reviews
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'supervisor'
    AND EXISTS (
      SELECT 1 FROM sessions s
      JOIN cohorts c ON c.id = s.cohort_id
      WHERE s.id = session_id AND c.supervisor_id = auth.uid()
    )
  );

-- Program admins and master admins see all in program
CREATE POLICY teacher_reviews_admin_select ON teacher_reviews
  FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

CREATE POLICY teacher_reviews_insert ON teacher_reviews
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY teacher_reviews_update ON teacher_reviews
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('supervisor', 'program_admin', 'master_admin')
    AND (is_master_admin() OR program_id = ANY(get_user_programs()))
  );

-- ─── teacher_rating_stats ────────────────────────────────────────────────────
CREATE POLICY rating_stats_select ON teacher_rating_stats
  FOR SELECT TO authenticated USING (true);

-- ─── free_program_queue ──────────────────────────────────────────────────────
CREATE POLICY queue_select ON free_program_queue
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR is_master_admin()
    OR (get_user_role() IN ('teacher', 'program_admin') AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY queue_insert ON free_program_queue
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- ─── daily_session_count ─────────────────────────────────────────────────────
CREATE POLICY daily_count_select ON daily_session_count
  FOR SELECT TO authenticated USING (student_id = auth.uid() OR is_master_admin());

-- ─── program_waitlist ────────────────────────────────────────────────────────
CREATE POLICY waitlist_select ON program_waitlist
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY waitlist_insert ON program_waitlist
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- ─── session_schedules ───────────────────────────────────────────────────────
CREATE POLICY schedules_select ON session_schedules
  FOR SELECT TO authenticated
  USING (
    is_master_admin()
    OR get_user_programs() IS NULL
    OR program_id = ANY(get_user_programs())
  );
CREATE POLICY schedules_insert ON session_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY schedules_update ON session_schedules
  FOR UPDATE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );
CREATE POLICY schedules_delete ON session_schedules
  FOR DELETE TO authenticated
  USING (
    is_master_admin()
    OR (get_user_role() = 'program_admin' AND program_id = ANY(get_user_programs()))
  );

-- ─── notification_preferences ────────────────────────────────────────────────
CREATE POLICY notification_prefs_select ON notification_preferences
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY notification_prefs_insert ON notification_preferences
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY notification_prefs_update ON notification_preferences
  FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY notification_prefs_delete ON notification_preferences
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ─── push_tokens ─────────────────────────────────────────────────────────────
CREATE POLICY push_tokens_select ON push_tokens
  FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY push_tokens_insert ON push_tokens
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY push_tokens_update ON push_tokens
  FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY push_tokens_delete ON push_tokens
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- =============================================================================
-- Section 6: Triggers
-- =============================================================================

-- Profile creation on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email, onboarding_completed, is_active)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    false,
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Rating stats recalculation
CREATE OR REPLACE FUNCTION recalculate_teacher_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_teacher_id UUID;
  target_program_id UUID;
BEGIN
  target_teacher_id := COALESCE(NEW.teacher_id, OLD.teacher_id);
  target_program_id := COALESCE(NEW.program_id, OLD.program_id);

  INSERT INTO teacher_rating_stats (
    teacher_id, program_id, total_reviews, average_rating,
    rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
    last_updated
  )
  SELECT
    target_teacher_id,
    target_program_id,
    COUNT(*),
    COALESCE(AVG(rating)::NUMERIC(3,2), 0.00),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5),
    now()
  FROM teacher_reviews
  WHERE teacher_id = target_teacher_id
    AND program_id = target_program_id
    AND is_excluded = false
  ON CONFLICT (teacher_id, program_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    last_updated = now();

  RETURN NULL;
END;
$$;

CREATE TRIGGER update_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON teacher_reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_teacher_rating_stats();

-- Auto-flag low reviews
CREATE OR REPLACE FUNCTION auto_flag_low_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating <= 2 THEN
    NEW.is_flagged = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER flag_low_reviews
  BEFORE INSERT OR UPDATE OF rating ON teacher_reviews
  FOR EACH ROW EXECUTE FUNCTION auto_flag_low_review();

-- =============================================================================
-- Section 7: Realtime Publication
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE teacher_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE free_program_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_reviews;

-- =============================================================================
-- Section 8: Initial platform_config row
-- =============================================================================

INSERT INTO platform_config (id) VALUES (gen_random_uuid());
