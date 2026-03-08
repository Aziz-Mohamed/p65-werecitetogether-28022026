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

-- Table 1: schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geofence_radius_meters INTEGER NOT NULL DEFAULT 200,
  wifi_ssid TEXT,
  verification_mode TEXT NOT NULL DEFAULT 'gps',
  verification_logic TEXT NOT NULL DEFAULT 'or',
  name_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT schools_verification_mode_check CHECK (verification_mode IN ('gps', 'wifi', 'both')),
  CONSTRAINT schools_verification_logic_check CHECK (verification_logic IN ('and', 'or')),
  CONSTRAINT schools_geofence_radius_range CHECK (geofence_radius_meters >= 50 AND geofence_radius_meters <= 2000),
  CONSTRAINT schools_coords_both_or_neither CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);

-- Table 2: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  username TEXT,
  name_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'parent', 'admin'))
);

-- Table 3: classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  schedule JSONB,
  max_students INTEGER NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT classes_max_students_check CHECK (max_students > 0)
);

-- Table 4: students
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date_of_birth DATE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_level INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  can_self_assign BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT students_current_streak_check CHECK (current_streak >= 0),
  CONSTRAINT students_longest_streak_check CHECK (longest_streak >= 0)
);

-- Table 5: sessions (initially WITHOUT scheduled_session_id)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recitation_quality INTEGER,
  tajweed_score INTEGER,
  memorization_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sessions_recitation_quality_check CHECK (recitation_quality >= 1 AND recitation_quality <= 5),
  CONSTRAINT sessions_tajweed_score_check CHECK (tajweed_score >= 1 AND tajweed_score <= 5),
  CONSTRAINT sessions_memorization_score_check CHECK (memorization_score >= 1 AND memorization_score <= 5)
);

-- Table 6: stickers
CREATE TABLE stickers (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'common',
  image_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stickers_tier_check CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond', 'seasonal'))
);

-- Table 7: student_stickers
CREATE TABLE student_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  sticker_id TEXT NOT NULL REFERENCES stickers(id),
  awarded_by UUID NOT NULL REFERENCES profiles(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  is_new BOOLEAN NOT NULL DEFAULT true
);

-- Table 8: teacher_checkins
CREATE TABLE teacher_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_latitude DOUBLE PRECISION,
  checkin_longitude DOUBLE PRECISION,
  checkout_latitude DOUBLE PRECISION,
  checkout_longitude DOUBLE PRECISION,
  checkin_distance_meters DOUBLE PRECISION,
  checkout_distance_meters DOUBLE PRECISION,
  verification_method TEXT NOT NULL DEFAULT 'none',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  override_reason TEXT,
  notes TEXT,
  checkin_wifi_ssid TEXT,
  checkout_wifi_ssid TEXT,
  CONSTRAINT teacher_checkins_verification_method_check CHECK (verification_method IN ('gps', 'wifi', 'both', 'manual', 'none'))
);

-- Table 9: push_tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_platform_check CHECK (platform IN ('ios', 'android'))
);

-- Table 10: notification_preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sticker_awarded BOOLEAN NOT NULL DEFAULT true,
  trophy_earned BOOLEAN NOT NULL DEFAULT true,
  achievement_unlocked BOOLEAN NOT NULL DEFAULT true,
  attendance_marked BOOLEAN NOT NULL DEFAULT true,
  session_completed BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT true,
  student_alert BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 11: teacher_work_schedules
CREATE TABLE teacher_work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, day_of_week),
  CONSTRAINT teacher_work_schedules_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT teacher_work_schedules_valid_hours CHECK (end_time > start_time)
);

-- Table 12: class_schedules
CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, day_of_week, start_time),
  CONSTRAINT class_schedules_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT class_schedules_valid_hours CHECK (end_time > start_time)
);

-- Table 13: scheduled_sessions
CREATE TABLE scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  class_schedule_id UUID REFERENCES class_schedules(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  title TEXT,
  notes TEXT,
  cancelled_reason TEXT,
  completed_at TIMESTAMPTZ,
  evaluation_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_sessions_session_type_check CHECK (session_type IN ('class', 'individual')),
  CONSTRAINT scheduled_sessions_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
  CONSTRAINT scheduled_sessions_valid_times CHECK (end_time > start_time),
  CONSTRAINT scheduled_sessions_individual_needs_student CHECK (session_type = 'class' OR student_id IS NOT NULL)
);

-- Add the deferred FK on sessions (circular dependency resolution)
ALTER TABLE sessions ADD COLUMN scheduled_session_id UUID REFERENCES scheduled_sessions(id) ON DELETE SET NULL;

-- Table 14: attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  scheduled_session_id UUID REFERENCES scheduled_sessions(id) ON DELETE SET NULL,
  UNIQUE (student_id, date),
  CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

-- Table 15: recitations
CREATE TABLE recitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  from_ayah INTEGER NOT NULL,
  to_ayah INTEGER NOT NULL,
  recitation_type TEXT NOT NULL,
  accuracy_score INTEGER,
  tajweed_score INTEGER,
  fluency_score INTEGER,
  needs_repeat BOOLEAN NOT NULL DEFAULT false,
  mistake_notes TEXT,
  recitation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recitations_surah_number_check CHECK (surah_number >= 1 AND surah_number <= 114),
  CONSTRAINT recitations_from_ayah_check CHECK (from_ayah >= 1),
  CONSTRAINT recitations_ayah_range_valid CHECK (to_ayah >= from_ayah),
  CONSTRAINT recitations_recitation_type_check CHECK (recitation_type IN ('new_hifz', 'recent_review', 'old_review')),
  CONSTRAINT recitations_accuracy_score_check CHECK (accuracy_score >= 1 AND accuracy_score <= 5),
  CONSTRAINT recitations_tajweed_score_check CHECK (tajweed_score >= 1 AND tajweed_score <= 5),
  CONSTRAINT recitations_fluency_score_check CHECK (fluency_score >= 1 AND fluency_score <= 5)
);

-- Table 16: memorization_progress
CREATE TABLE memorization_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  from_ayah INTEGER NOT NULL,
  to_ayah INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  last_reviewed_at TIMESTAMPTZ,
  next_review_date DATE,
  review_count INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 0,
  avg_accuracy NUMERIC(3,2),
  avg_tajweed NUMERIC(3,2),
  avg_fluency NUMERIC(3,2),
  first_memorized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, surah_number, from_ayah, to_ayah),
  CONSTRAINT memorization_progress_surah_number_check CHECK (surah_number >= 1 AND surah_number <= 114),
  CONSTRAINT memorization_progress_from_ayah_check CHECK (from_ayah >= 1),
  CONSTRAINT memorization_progress_ayah_range_valid CHECK (to_ayah >= from_ayah),
  CONSTRAINT memorization_progress_status_check CHECK (status IN ('new', 'learning', 'memorized', 'needs_review')),
  CONSTRAINT memorization_progress_review_count_range CHECK (review_count >= 0),
  CONSTRAINT memorization_progress_ease_factor_range CHECK (ease_factor >= 1.30 AND ease_factor <= 5.00),
  CONSTRAINT memorization_progress_interval_range CHECK (interval_days >= 0)
);

-- Table 17: quran_rub_reference
CREATE TABLE quran_rub_reference (
  rub_number INTEGER PRIMARY KEY,
  juz_number SMALLINT NOT NULL,
  hizb_number SMALLINT NOT NULL,
  quarter_in_hizb SMALLINT NOT NULL,
  start_surah SMALLINT NOT NULL,
  start_ayah SMALLINT NOT NULL,
  end_surah SMALLINT NOT NULL,
  end_ayah SMALLINT NOT NULL,
  CONSTRAINT quran_rub_reference_rub_number_check CHECK (rub_number >= 1 AND rub_number <= 240),
  CONSTRAINT quran_rub_reference_juz_number_check CHECK (juz_number >= 1 AND juz_number <= 30),
  CONSTRAINT quran_rub_reference_hizb_number_check CHECK (hizb_number >= 1 AND hizb_number <= 60),
  CONSTRAINT quran_rub_reference_quarter_in_hizb_check CHECK (quarter_in_hizb >= 1 AND quarter_in_hizb <= 4),
  CONSTRAINT quran_rub_reference_start_surah_check CHECK (start_surah >= 1 AND start_surah <= 114),
  CONSTRAINT quran_rub_reference_start_ayah_check CHECK (start_ayah >= 1),
  CONSTRAINT quran_rub_reference_end_surah_check CHECK (end_surah >= 1 AND end_surah <= 114),
  CONSTRAINT quran_rub_reference_end_ayah_check CHECK (end_ayah >= 1)
);

-- Table 18: memorization_assignments
CREATE TABLE memorization_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  from_ayah INTEGER NOT NULL,
  to_ayah INTEGER NOT NULL,
  assignment_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT memorization_assignments_surah_number_check CHECK (surah_number >= 1 AND surah_number <= 114),
  CONSTRAINT memorization_assignments_from_ayah_check CHECK (from_ayah >= 1),
  CONSTRAINT memorization_assignments_ayah_range_valid CHECK (to_ayah >= from_ayah),
  CONSTRAINT memorization_assignments_assignment_type_check CHECK (assignment_type IN ('new_hifz', 'recent_review', 'old_review')),
  CONSTRAINT memorization_assignments_status_check CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled'))
);

-- Table 19: student_rub_certifications
CREATE TABLE student_rub_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rub_number INTEGER NOT NULL REFERENCES quran_rub_reference(rub_number),
  certified_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dormant_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, rub_number),
  CONSTRAINT student_rub_certifications_review_count_check CHECK (review_count >= 0)
);

-- Table 20: session_recitation_plans
CREATE TABLE session_recitation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  scheduled_session_id UUID NOT NULL REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selection_mode TEXT NOT NULL DEFAULT 'ayah_range',
  start_surah SMALLINT NOT NULL,
  start_ayah SMALLINT NOT NULL,
  end_surah SMALLINT NOT NULL,
  end_ayah SMALLINT NOT NULL,
  rub_number INTEGER REFERENCES quran_rub_reference(rub_number),
  juz_number SMALLINT,
  hizb_number SMALLINT,
  recitation_type TEXT NOT NULL DEFAULT 'new_hifz',
  source TEXT NOT NULL DEFAULT 'manual',
  assignment_id UUID REFERENCES memorization_assignments(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT session_recitation_plans_selection_mode_check CHECK (selection_mode IN ('ayah_range', 'rub', 'hizb', 'juz', 'surah')),
  CONSTRAINT session_recitation_plans_start_surah_check CHECK (start_surah >= 1 AND start_surah <= 114),
  CONSTRAINT session_recitation_plans_start_ayah_check CHECK (start_ayah >= 1),
  CONSTRAINT session_recitation_plans_end_surah_check CHECK (end_surah >= 1 AND end_surah <= 114),
  CONSTRAINT session_recitation_plans_end_ayah_check CHECK (end_ayah >= 1),
  CONSTRAINT session_recitation_plans_juz_number_check CHECK (juz_number >= 1 AND juz_number <= 30),
  CONSTRAINT session_recitation_plans_hizb_number_check CHECK (hizb_number >= 1 AND hizb_number <= 60),
  CONSTRAINT session_recitation_plans_recitation_type_check CHECK (recitation_type IN ('new_hifz', 'recent_review', 'old_review')),
  CONSTRAINT session_recitation_plans_source_check CHECK (source IN ('manual', 'from_assignment', 'student_suggestion'))
);

-- =============================================================================
-- Section 3: Functions
-- =============================================================================

-- 3a. Helper Functions

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE this function — 33 RLS policies depend on it.
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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

CREATE OR REPLACE FUNCTION get_child_score_trend(p_student_id uuid, p_class_id uuid, p_start_date date, p_end_date date, p_granularity text)
 RETURNS TABLE(bucket_date date, avg_memorization numeric, avg_tajweed numeric, avg_recitation numeric, class_avg_memorization numeric, class_avg_tajweed numeric, class_avg_recitation numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  WITH child_scores AS (
    SELECT
      date_trunc(p_granularity, s.session_date)::DATE AS bucket,
      ROUND(AVG(s.memorization_score)::NUMERIC, 2) AS mem,
      ROUND(AVG(s.tajweed_score)::NUMERIC, 2) AS taj,
      ROUND(AVG(s.recitation_quality)::NUMERIC, 2) AS rec
    FROM sessions s
    WHERE s.student_id = p_student_id
      AND s.session_date >= p_start_date
      AND s.session_date <= p_end_date
      AND (s.memorization_score IS NOT NULL
           OR s.tajweed_score IS NOT NULL
           OR s.recitation_quality IS NOT NULL)
    GROUP BY bucket
  ),
  class_scores AS (
    SELECT
      date_trunc(p_granularity, s.session_date)::DATE AS bucket,
      ROUND(AVG(s.memorization_score)::NUMERIC, 2) AS mem,
      ROUND(AVG(s.tajweed_score)::NUMERIC, 2) AS taj,
      ROUND(AVG(s.recitation_quality)::NUMERIC, 2) AS rec
    FROM sessions s
    INNER JOIN students st ON st.id = s.student_id
    WHERE st.class_id = p_class_id
      AND s.session_date >= p_start_date
      AND s.session_date <= p_end_date
      AND (s.memorization_score IS NOT NULL
           OR s.tajweed_score IS NOT NULL
           OR s.recitation_quality IS NOT NULL)
    GROUP BY bucket
  )
  SELECT
    COALESCE(c.bucket, cl.bucket) AS bucket_date,
    c.mem AS avg_memorization,
    c.taj AS avg_tajweed,
    c.rec AS avg_recitation,
    cl.mem AS class_avg_memorization,
    cl.taj AS class_avg_tajweed,
    cl.rec AS class_avg_recitation
  FROM child_scores c
  FULL OUTER JOIN class_scores cl ON c.bucket = cl.bucket
  ORDER BY bucket_date;
$function$;

CREATE OR REPLACE FUNCTION get_period_comparison(p_school_id uuid, p_current_start date, p_current_end date, p_previous_start date, p_previous_end date, p_class_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(current_attendance_rate numeric, previous_attendance_rate numeric, current_avg_memorization numeric, current_avg_tajweed numeric, current_avg_recitation numeric, previous_avg_memorization numeric, previous_avg_tajweed numeric, previous_avg_recitation numeric, current_stickers bigint, previous_stickers bigint)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  WITH current_attendance AS (
    SELECT
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'present') + COUNT(*) FILTER (WHERE status = 'late'))::NUMERIC
        / NULLIF(
            (COUNT(*) FILTER (WHERE status = 'present')
             + COUNT(*) FILTER (WHERE status = 'absent')
             + COUNT(*) FILTER (WHERE status = 'late')),
            0
          )
        * 100,
        1
      ) AS rate
    FROM attendance
    WHERE school_id = p_school_id
      AND date >= p_current_start
      AND date <= p_current_end
      AND (p_class_id IS NULL OR class_id = p_class_id)
  ),
  previous_attendance AS (
    SELECT
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'present') + COUNT(*) FILTER (WHERE status = 'late'))::NUMERIC
        / NULLIF(
            (COUNT(*) FILTER (WHERE status = 'present')
             + COUNT(*) FILTER (WHERE status = 'absent')
             + COUNT(*) FILTER (WHERE status = 'late')),
            0
          )
        * 100,
        1
      ) AS rate
    FROM attendance
    WHERE school_id = p_school_id
      AND date >= p_previous_start
      AND date <= p_previous_end
      AND (p_class_id IS NULL OR class_id = p_class_id)
  ),
  current_scores AS (
    SELECT
      ROUND(AVG(memorization_score)::NUMERIC, 1) AS avg_mem,
      ROUND(AVG(tajweed_score)::NUMERIC, 1) AS avg_taj,
      ROUND(AVG(recitation_quality)::NUMERIC, 1) AS avg_rec
    FROM sessions
    WHERE school_id = p_school_id
      AND session_date >= p_current_start
      AND session_date <= p_current_end
      AND (p_class_id IS NULL OR class_id = p_class_id)
  ),
  previous_scores AS (
    SELECT
      ROUND(AVG(memorization_score)::NUMERIC, 1) AS avg_mem,
      ROUND(AVG(tajweed_score)::NUMERIC, 1) AS avg_taj,
      ROUND(AVG(recitation_quality)::NUMERIC, 1) AS avg_rec
    FROM sessions
    WHERE school_id = p_school_id
      AND session_date >= p_previous_start
      AND session_date <= p_previous_end
      AND (p_class_id IS NULL OR class_id = p_class_id)
  ),
  current_stickers_cte AS (
    SELECT COUNT(*) AS cnt
    FROM student_stickers ss
    JOIN students s ON ss.student_id = s.id
    WHERE s.school_id = p_school_id
      AND ss.awarded_at >= p_current_start::TIMESTAMP
      AND ss.awarded_at < (p_current_end + 1)::TIMESTAMP
      AND (p_class_id IS NULL OR s.class_id = p_class_id)
  ),
  previous_stickers_cte AS (
    SELECT COUNT(*) AS cnt
    FROM student_stickers ss
    JOIN students s ON ss.student_id = s.id
    WHERE s.school_id = p_school_id
      AND ss.awarded_at >= p_previous_start::TIMESTAMP
      AND ss.awarded_at < (p_previous_end + 1)::TIMESTAMP
      AND (p_class_id IS NULL OR s.class_id = p_class_id)
  )
  SELECT
    COALESCE(ca.rate, 0) AS current_attendance_rate,
    COALESCE(pa.rate, 0) AS previous_attendance_rate,
    COALESCE(cs.avg_mem, 0) AS current_avg_memorization,
    COALESCE(cs.avg_taj, 0) AS current_avg_tajweed,
    COALESCE(cs.avg_rec, 0) AS current_avg_recitation,
    COALESCE(ps.avg_mem, 0) AS previous_avg_memorization,
    COALESCE(ps.avg_taj, 0) AS previous_avg_tajweed,
    COALESCE(ps.avg_rec, 0) AS previous_avg_recitation,
    COALESCE(cst.cnt, 0) AS current_stickers,
    COALESCE(pst.cnt, 0) AS previous_stickers
  FROM current_attendance ca
  CROSS JOIN previous_attendance pa
  CROSS JOIN current_scores cs
  CROSS JOIN previous_scores ps
  CROSS JOIN current_stickers_cte cst
  CROSS JOIN previous_stickers_cte pst;
$function$;

CREATE OR REPLACE FUNCTION get_teacher_attendance_kpis(p_school_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(teacher_id uuid, full_name text, avatar_url text, days_present bigint, days_on_time bigint, days_late bigint, total_hours_worked numeric, avg_hours_per_day numeric, punctuality_rate numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id AS teacher_id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT tc.date) AS days_present,
    COUNT(DISTINCT tc.date) FILTER (
      WHERE tc.checked_in_at::TIME <=
        COALESCE(
          (SELECT tws.start_time + INTERVAL '15 minutes'
           FROM teacher_work_schedules tws
           WHERE tws.teacher_id = p.id
             AND tws.day_of_week = EXTRACT(DOW FROM tc.date)::INTEGER
             AND tws.is_active = true
           LIMIT 1),
          '23:59'::TIME
        )
    ) AS days_on_time,
    COUNT(DISTINCT tc.date) FILTER (
      WHERE tc.checked_in_at::TIME >
        COALESCE(
          (SELECT tws.start_time + INTERVAL '15 minutes'
           FROM teacher_work_schedules tws
           WHERE tws.teacher_id = p.id
             AND tws.day_of_week = EXTRACT(DOW FROM tc.date)::INTEGER
             AND tws.is_active = true
           LIMIT 1),
          '23:59'::TIME
        )
    ) AS days_late,
    ROUND(
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (
          COALESCE(tc.checked_out_at, tc.checked_in_at) - tc.checked_in_at
        )) / 3600.0
      ), 0)::NUMERIC,
      1
    ) AS total_hours_worked,
    ROUND(
      COALESCE(AVG(
        EXTRACT(EPOCH FROM (
          COALESCE(tc.checked_out_at, tc.checked_in_at) - tc.checked_in_at
        )) / 3600.0
      ), 0)::NUMERIC,
      1
    ) AS avg_hours_per_day,
    ROUND(
      COALESCE(
        COUNT(DISTINCT tc.date) FILTER (
          WHERE tc.checked_in_at::TIME <=
            COALESCE(
              (SELECT tws.start_time + INTERVAL '15 minutes'
               FROM teacher_work_schedules tws
               WHERE tws.teacher_id = p.id
                 AND tws.day_of_week = EXTRACT(DOW FROM tc.date)::INTEGER
                 AND tws.is_active = true
               LIMIT 1),
              '23:59'::TIME
            )
        )::NUMERIC
        / NULLIF(COUNT(DISTINCT tc.date), 0)::NUMERIC * 100,
        0
      ),
      1
    ) AS punctuality_rate
  FROM profiles p
  LEFT JOIN teacher_checkins tc
    ON tc.teacher_id = p.id
    AND tc.date >= p_start_date
    AND tc.date <= p_end_date
    AND tc.is_verified = true
  WHERE p.school_id = p_school_id
    AND p.role = 'teacher'
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY days_present DESC;
$function$;

CREATE OR REPLACE FUNCTION get_session_completion_stats(p_school_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(teacher_id uuid, full_name text, total_scheduled bigint, completed_count bigint, cancelled_count bigint, missed_count bigint, completion_rate numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id AS teacher_id,
    p.full_name,
    COUNT(ss.id) AS total_scheduled,
    COUNT(ss.id) FILTER (WHERE ss.status = 'completed') AS completed_count,
    COUNT(ss.id) FILTER (WHERE ss.status = 'cancelled') AS cancelled_count,
    COUNT(ss.id) FILTER (WHERE ss.status = 'missed') AS missed_count,
    ROUND(
      COALESCE(
        COUNT(ss.id) FILTER (WHERE ss.status = 'completed')::NUMERIC
        / NULLIF(COUNT(ss.id) FILTER (WHERE ss.status IN ('completed', 'missed')), 0)::NUMERIC
        * 100,
        0
      ),
      1
    ) AS completion_rate
  FROM profiles p
  LEFT JOIN scheduled_sessions ss
    ON ss.teacher_id = p.id
    AND ss.session_date >= p_start_date
    AND ss.session_date <= p_end_date
  WHERE p.school_id = p_school_id
    AND p.role = 'teacher'
  GROUP BY p.id, p.full_name
  ORDER BY completion_rate DESC NULLS LAST;
$function$;

CREATE OR REPLACE FUNCTION get_student_memorization_stats(p_student_id uuid)
 RETURNS TABLE(total_ayahs_memorized bigint, total_ayahs_in_progress bigint, surahs_started bigint, surahs_completed bigint, quran_percentage numeric, items_needing_review bigint, total_recitations bigint, avg_overall_accuracy numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(
      CASE WHEN mp.status = 'memorized'
        THEN mp.to_ayah - mp.from_ayah + 1
        ELSE 0
      END
    ), 0) AS total_ayahs_memorized,
    COALESCE(SUM(
      CASE WHEN mp.status IN ('learning', 'new')
        THEN mp.to_ayah - mp.from_ayah + 1
        ELSE 0
      END
    ), 0) AS total_ayahs_in_progress,
    COUNT(DISTINCT mp.surah_number) AS surahs_started,
    (SELECT COUNT(DISTINCT sub.surah_number)
     FROM memorization_progress sub
     WHERE sub.student_id = p_student_id
       AND sub.status = 'memorized'
    ) AS surahs_completed,
    ROUND(
      COALESCE(SUM(
        CASE WHEN mp.status = 'memorized'
          THEN mp.to_ayah - mp.from_ayah + 1
          ELSE 0
        END
      ), 0)::NUMERIC / 6236.0 * 100,
      2
    ) AS quran_percentage,
    COUNT(*) FILTER (WHERE mp.status = 'needs_review') AS items_needing_review,
    (SELECT COUNT(*) FROM recitations r WHERE r.student_id = p_student_id) AS total_recitations,
    (SELECT ROUND(AVG(r.accuracy_score)::NUMERIC, 2) FROM recitations r WHERE r.student_id = p_student_id AND r.accuracy_score IS NOT NULL) AS avg_overall_accuracy
  FROM memorization_progress mp
  WHERE mp.student_id = p_student_id;
$function$;

CREATE OR REPLACE FUNCTION get_student_revision_schedule(p_student_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(progress_id uuid, surah_number integer, from_ayah integer, to_ayah integer, status text, review_type text, next_review_date date, last_reviewed_at timestamp with time zone, review_count integer, ease_factor numeric, avg_accuracy numeric, avg_tajweed numeric, avg_fluency numeric, first_memorized_at timestamp with time zone)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  -- New hifz assignments for today
  SELECT
    NULL::UUID AS progress_id,
    ma.surah_number,
    ma.from_ayah,
    ma.to_ayah,
    'assigned'::TEXT AS status,
    'new_hifz'::TEXT AS review_type,
    ma.due_date AS next_review_date,
    NULL::TIMESTAMPTZ AS last_reviewed_at,
    0 AS review_count,
    2.50::NUMERIC AS ease_factor,
    NULL::NUMERIC AS avg_accuracy,
    NULL::NUMERIC AS avg_tajweed,
    NULL::NUMERIC AS avg_fluency,
    NULL::TIMESTAMPTZ AS first_memorized_at
  FROM memorization_assignments ma
  WHERE ma.student_id = p_student_id
    AND ma.assignment_type = 'new_hifz'
    AND ma.status = 'pending'
    AND ma.due_date <= p_date

  UNION ALL

  -- Review assignments (self-assigned from "Add to Plan" or teacher-assigned reviews)
  SELECT
    NULL::UUID AS progress_id,
    ma.surah_number,
    ma.from_ayah,
    ma.to_ayah,
    'assigned'::TEXT AS status,
    ma.assignment_type::TEXT AS review_type,
    ma.due_date AS next_review_date,
    NULL::TIMESTAMPTZ AS last_reviewed_at,
    0 AS review_count,
    2.50::NUMERIC AS ease_factor,
    NULL::NUMERIC AS avg_accuracy,
    NULL::NUMERIC AS avg_tajweed,
    NULL::NUMERIC AS avg_fluency,
    NULL::TIMESTAMPTZ AS first_memorized_at
  FROM memorization_assignments ma
  WHERE ma.student_id = p_student_id
    AND ma.assignment_type IN ('old_review', 'recent_review')
    AND ma.status = 'pending'
    AND ma.due_date <= p_date

  UNION ALL

  -- Near revision: memorized within last 20 days, due for review
  SELECT
    mp.id AS progress_id,
    mp.surah_number,
    mp.from_ayah,
    mp.to_ayah,
    mp.status,
    'recent_review'::TEXT AS review_type,
    mp.next_review_date,
    mp.last_reviewed_at,
    mp.review_count,
    mp.ease_factor,
    mp.avg_accuracy,
    mp.avg_tajweed,
    mp.avg_fluency,
    mp.first_memorized_at
  FROM memorization_progress mp
  WHERE mp.student_id = p_student_id
    AND mp.status IN ('memorized', 'learning', 'needs_review')
    AND mp.first_memorized_at IS NOT NULL
    AND mp.first_memorized_at >= (p_date - INTERVAL '20 days')
    AND (mp.next_review_date IS NULL OR mp.next_review_date <= p_date)

  UNION ALL

  -- Far revision: memorized more than 20 days ago, due for review
  SELECT
    mp.id AS progress_id,
    mp.surah_number,
    mp.from_ayah,
    mp.to_ayah,
    mp.status,
    'old_review'::TEXT AS review_type,
    mp.next_review_date,
    mp.last_reviewed_at,
    mp.review_count,
    mp.ease_factor,
    mp.avg_accuracy,
    mp.avg_tajweed,
    mp.avg_fluency,
    mp.first_memorized_at
  FROM memorization_progress mp
  WHERE mp.student_id = p_student_id
    AND mp.status IN ('memorized', 'learning', 'needs_review')
    AND mp.first_memorized_at IS NOT NULL
    AND mp.first_memorized_at < (p_date - INTERVAL '20 days')
    AND (mp.next_review_date IS NULL OR mp.next_review_date <= p_date)

  ORDER BY next_review_date ASC NULLS FIRST;
$function$;

-- =============================================================================
-- Section 4: Indexes (74 non-primary)
-- =============================================================================

-- attendance indexes
CREATE INDEX idx_attendance_school_id ON attendance USING btree (school_id);
CREATE INDEX idx_attendance_student_id ON attendance USING btree (student_id);
CREATE INDEX idx_attendance_class_id ON attendance USING btree (class_id);
CREATE INDEX idx_attendance_date ON attendance USING btree (date);
CREATE INDEX idx_attendance_marked_by ON attendance USING btree (marked_by);
CREATE INDEX idx_attendance_scheduled_session ON attendance USING btree (scheduled_session_id);
CREATE INDEX idx_attendance_student_date ON attendance USING btree (student_id, date);

-- class_schedules indexes
CREATE INDEX idx_class_schedules_class ON class_schedules USING btree (class_id);
CREATE INDEX idx_class_schedules_school ON class_schedules USING btree (school_id);

-- classes indexes
CREATE INDEX idx_classes_school_id ON classes USING btree (school_id);
CREATE INDEX idx_classes_teacher_id ON classes USING btree (teacher_id);
CREATE INDEX idx_classes_name_localized ON classes USING gin (name_localized);

-- memorization_assignments indexes
CREATE INDEX idx_memorization_assignments_school ON memorization_assignments USING btree (school_id);
CREATE INDEX idx_memorization_assignments_student ON memorization_assignments USING btree (student_id);
CREATE INDEX idx_memorization_assignments_assigned_by ON memorization_assignments USING btree (assigned_by);
CREATE INDEX idx_memorization_assignments_due_date ON memorization_assignments USING btree (due_date);
CREATE INDEX idx_memorization_assignments_status ON memorization_assignments USING btree (status);
CREATE INDEX idx_memorization_assignments_student_status ON memorization_assignments USING btree (student_id, status);

-- memorization_progress indexes
CREATE INDEX idx_memorization_progress_school ON memorization_progress USING btree (school_id);
CREATE INDEX idx_memorization_progress_student ON memorization_progress USING btree (student_id);
CREATE INDEX idx_memorization_progress_student_status ON memorization_progress USING btree (student_id, status);
CREATE INDEX idx_memorization_progress_student_surah ON memorization_progress USING btree (student_id, surah_number);
CREATE INDEX idx_memorization_progress_next_review ON memorization_progress USING btree (next_review_date);

-- profiles indexes
CREATE INDEX idx_profiles_school_id ON profiles USING btree (school_id);
CREATE INDEX idx_profiles_role ON profiles USING btree (role);
CREATE UNIQUE INDEX idx_profiles_school_username ON profiles USING btree (school_id, username);
CREATE INDEX idx_profiles_name_localized ON profiles USING gin (name_localized);

-- push_tokens indexes
CREATE INDEX idx_push_tokens_user_id ON push_tokens USING btree (user_id);

-- recitations indexes
CREATE INDEX idx_recitations_school ON recitations USING btree (school_id);
CREATE INDEX idx_recitations_student ON recitations USING btree (student_id);
CREATE INDEX idx_recitations_teacher ON recitations USING btree (teacher_id);
CREATE INDEX idx_recitations_session ON recitations USING btree (session_id);
CREATE INDEX idx_recitations_date ON recitations USING btree (recitation_date);
CREATE INDEX idx_recitations_type ON recitations USING btree (recitation_type);
CREATE INDEX idx_recitations_student_surah ON recitations USING btree (student_id, surah_number);

-- scheduled_sessions indexes
CREATE INDEX idx_scheduled_sessions_school ON scheduled_sessions USING btree (school_id);
CREATE INDEX idx_scheduled_sessions_class ON scheduled_sessions USING btree (class_id);
CREATE INDEX idx_scheduled_sessions_teacher ON scheduled_sessions USING btree (teacher_id);
CREATE INDEX idx_scheduled_sessions_student ON scheduled_sessions USING btree (student_id);
CREATE INDEX idx_scheduled_sessions_date ON scheduled_sessions USING btree (session_date);
CREATE INDEX idx_scheduled_sessions_status ON scheduled_sessions USING btree (status);
CREATE INDEX idx_scheduled_sessions_type_date ON scheduled_sessions USING btree (session_type, session_date);
CREATE UNIQUE INDEX idx_scheduled_sessions_dedup ON scheduled_sessions USING btree (class_schedule_id, session_date) WHERE (class_schedule_id IS NOT NULL);

-- schools indexes
CREATE INDEX idx_schools_name_localized ON schools USING gin (name_localized);

-- session_recitation_plans indexes
CREATE INDEX idx_recitation_plans_school ON session_recitation_plans USING btree (school_id);
CREATE INDEX idx_recitation_plans_session ON session_recitation_plans USING btree (scheduled_session_id);
CREATE INDEX idx_recitation_plans_student ON session_recitation_plans USING btree (student_id) WHERE (student_id IS NOT NULL);
CREATE INDEX idx_recitation_plans_set_by ON session_recitation_plans USING btree (set_by);
CREATE INDEX idx_recitation_plans_assignment ON session_recitation_plans USING btree (assignment_id) WHERE (assignment_id IS NOT NULL);
CREATE UNIQUE INDEX idx_recitation_plans_session_default ON session_recitation_plans USING btree (scheduled_session_id) WHERE (student_id IS NULL);
CREATE UNIQUE INDEX idx_recitation_plans_teacher_per_student ON session_recitation_plans USING btree (scheduled_session_id, student_id) WHERE (source <> 'student_suggestion');

-- sessions indexes
CREATE INDEX idx_sessions_school_id ON sessions USING btree (school_id);
CREATE INDEX idx_sessions_student_id ON sessions USING btree (student_id);
CREATE INDEX idx_sessions_teacher_id ON sessions USING btree (teacher_id);
CREATE INDEX idx_sessions_class_id ON sessions USING btree (class_id);
CREATE INDEX idx_sessions_session_date ON sessions USING btree (session_date);
CREATE INDEX idx_sessions_scheduled_session_id ON sessions USING btree (scheduled_session_id) WHERE (scheduled_session_id IS NOT NULL);

-- student_rub_certifications indexes
CREATE INDEX idx_rub_certifications_student ON student_rub_certifications USING btree (student_id);
CREATE INDEX idx_rub_certifications_student_active ON student_rub_certifications USING btree (student_id) WHERE (dormant_since IS NULL);
CREATE INDEX idx_rub_certifications_dormant ON student_rub_certifications USING btree (student_id, dormant_since) WHERE (dormant_since IS NOT NULL);

-- student_stickers indexes
CREATE INDEX idx_student_stickers_student ON student_stickers USING btree (student_id);
CREATE INDEX idx_student_stickers_sticker ON student_stickers USING btree (sticker_id);
CREATE INDEX idx_student_stickers_awarded_at ON student_stickers USING btree (awarded_at DESC);

-- students indexes
CREATE INDEX idx_students_school_id ON students USING btree (school_id);
CREATE INDEX idx_students_class_id ON students USING btree (class_id);
CREATE INDEX idx_students_parent_id ON students USING btree (parent_id);

-- teacher_checkins indexes
CREATE INDEX idx_teacher_checkins_school_id ON teacher_checkins USING btree (school_id);
CREATE INDEX idx_teacher_checkins_teacher_id ON teacher_checkins USING btree (teacher_id);
CREATE INDEX idx_teacher_checkins_class_id ON teacher_checkins USING btree (class_id);
CREATE INDEX idx_teacher_checkins_date ON teacher_checkins USING btree (date);
CREATE INDEX idx_teacher_checkins_is_verified ON teacher_checkins USING btree (is_verified);
CREATE INDEX idx_teacher_checkins_verification_method ON teacher_checkins USING btree (verification_method);

-- teacher_work_schedules indexes
CREATE INDEX idx_teacher_work_schedules_school ON teacher_work_schedules USING btree (school_id);
CREATE INDEX idx_teacher_work_schedules_teacher ON teacher_work_schedules USING btree (teacher_id);

-- =============================================================================
-- Section 5: RLS Enable + Policies (120 policies)
-- =============================================================================

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- schools (2 policies)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own school" ON schools FOR SELECT USING (id = get_user_school_id());
CREATE POLICY "Admin can update own school" ON schools FOR UPDATE USING ((id = get_user_school_id()) AND (get_user_role() = 'admin'::text));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- profiles (5 policies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read school profiles" ON profiles FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin can insert profiles" ON profiles FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete profiles" ON profiles FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- classes (5 policies)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read school classes" ON classes FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin can insert classes" ON classes FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update classes" ON classes FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete classes" ON classes FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can update own classes" ON classes FOR UPDATE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- students (7 policies)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school students" ON students FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert students" ON students FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update students" ON students FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete students" ON students FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read class students" ON students FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text) AND (class_id IN ( SELECT classes.id FROM classes WHERE (classes.teacher_id = auth.uid()))));
CREATE POLICY "Student can read own record" ON students FOR SELECT USING ((id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Parent can read children" ON students FOR SELECT USING ((parent_id = auth.uid()) AND (get_user_role() = 'parent'::text));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- sessions (9 policies)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school sessions" ON sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert sessions" ON sessions FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update sessions" ON sessions FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete sessions" ON sessions FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school sessions" ON sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert own sessions" ON sessions FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update own sessions" ON sessions FOR UPDATE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own sessions" ON sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Parent can read children sessions" ON sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- attendance (9 policies)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school attendance" ON attendance FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert attendance" ON attendance FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update attendance" ON attendance FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete attendance" ON attendance FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school attendance" ON attendance FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert attendance" ON attendance FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (marked_by = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update attendance" ON attendance FOR UPDATE USING ((school_id = get_user_school_id()) AND (marked_by = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own attendance" ON attendance FOR SELECT USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Parent can read children attendance" ON attendance FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- stickers (1 policy)
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stickers" ON stickers FOR SELECT USING (true);

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- student_stickers (7 policies)
ALTER TABLE student_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read school student stickers" ON student_stickers FOR SELECT USING ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Admin can award stickers" ON student_stickers FOR INSERT WITH CHECK ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Admin can delete student stickers" ON student_stickers FOR DELETE USING ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Teacher can read class student stickers" ON student_stickers FOR SELECT USING ((get_user_role() = 'teacher'::text) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can award stickers" ON student_stickers FOR INSERT WITH CHECK ((get_user_role() = 'teacher'::text) AND (awarded_by = auth.uid()) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Student can read own stickers" ON student_stickers FOR SELECT USING ((get_user_role() = 'student'::text) AND (student_id = auth.uid()));
CREATE POLICY "Parent can read children stickers" ON student_stickers FOR SELECT USING ((get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- teacher_checkins (8 policies)
ALTER TABLE teacher_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school teacher checkins" ON teacher_checkins FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert teacher checkins" ON teacher_checkins FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update teacher checkins" ON teacher_checkins FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete teacher checkins" ON teacher_checkins FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read own checkins" ON teacher_checkins FOR SELECT USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert own checkins" ON teacher_checkins FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update own checkins" ON teacher_checkins FOR UPDATE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can delete own checkins" ON teacher_checkins FOR DELETE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));

-- push_tokens (4 policies)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens" ON push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push tokens" ON push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push tokens" ON push_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own push tokens" ON push_tokens FOR DELETE USING (auth.uid() = user_id);

-- notification_preferences (4 policies)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notification preferences" ON notification_preferences FOR DELETE USING (auth.uid() = user_id);

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- teacher_work_schedules (5 policies)
ALTER TABLE teacher_work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read school work schedules" ON teacher_work_schedules FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert work schedules" ON teacher_work_schedules FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update work schedules" ON teacher_work_schedules FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete work schedules" ON teacher_work_schedules FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read own work schedule" ON teacher_work_schedules FOR SELECT USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- class_schedules (4 policies)
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read school class schedules" ON class_schedules FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin can insert class schedules" ON class_schedules FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update class schedules" ON class_schedules FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete class schedules" ON class_schedules FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- scheduled_sessions (9 policies)
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school scheduled sessions" ON scheduled_sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can insert scheduled sessions" ON scheduled_sessions FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can update scheduled sessions" ON scheduled_sessions FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Admin can delete scheduled sessions" ON scheduled_sessions FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school scheduled sessions" ON scheduled_sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert own scheduled sessions" ON scheduled_sessions FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update own scheduled sessions" ON scheduled_sessions FOR UPDATE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own scheduled sessions" ON scheduled_sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'student'::text) AND (((session_type = 'class'::text) AND (class_id IN ( SELECT students.class_id FROM students WHERE (students.id = auth.uid())))) OR ((session_type = 'individual'::text) AND (student_id = auth.uid()))));
CREATE POLICY "Parent can read children scheduled sessions" ON scheduled_sessions FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (((session_type = 'class'::text) AND (class_id IN ( SELECT students.class_id FROM students WHERE (students.parent_id = auth.uid())))) OR ((session_type = 'individual'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- recitations (6 policies)
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school recitations" ON recitations FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school recitations" ON recitations FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert recitations" ON recitations FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update own recitations" ON recitations FOR UPDATE USING ((school_id = get_user_school_id()) AND (teacher_id = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own recitations" ON recitations FOR SELECT USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Parent can read children recitations" ON recitations FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- memorization_progress (6 policies)
ALTER TABLE memorization_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read all school memorization progress" ON memorization_progress FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school memorization progress" ON memorization_progress FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert memorization progress" ON memorization_progress FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update school memorization progress" ON memorization_progress FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own memorization progress" ON memorization_progress FOR SELECT USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Parent can read children memorization progress" ON memorization_progress FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- memorization_assignments (8 policies)
ALTER TABLE memorization_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all school assignments" ON memorization_assignments FOR ALL USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school assignments" ON memorization_assignments FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert assignments" ON memorization_assignments FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (assigned_by = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can update own assignments" ON memorization_assignments FOR UPDATE USING ((school_id = get_user_school_id()) AND (assigned_by = auth.uid()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Student can read own assignments" ON memorization_assignments FOR SELECT USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (get_user_role() = 'student'::text));
CREATE POLICY "Student with self-assign can insert own assignments" ON memorization_assignments FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (assigned_by = auth.uid()) AND (get_user_role() = 'student'::text) AND (EXISTS ( SELECT 1 FROM students WHERE ((students.id = auth.uid()) AND (students.can_self_assign = true)))));
CREATE POLICY "Student can cancel own self-assigned homework" ON memorization_assignments FOR UPDATE USING ((school_id = get_user_school_id()) AND (student_id = auth.uid()) AND (assigned_by = auth.uid()) AND (get_user_role() = 'student'::text)) WITH CHECK (status = 'cancelled'::text);
CREATE POLICY "Parent can read children assignments" ON memorization_assignments FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- quran_rub_reference (1 policy)
ALTER TABLE quran_rub_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rub reference" ON quran_rub_reference FOR SELECT USING (true);

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- student_rub_certifications (10 policies)
ALTER TABLE student_rub_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read school student certifications" ON student_rub_certifications FOR SELECT USING ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Admin can insert school student certifications" ON student_rub_certifications FOR INSERT WITH CHECK ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Admin can update school student certifications" ON student_rub_certifications FOR UPDATE USING ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Admin can delete school student certifications" ON student_rub_certifications FOR DELETE USING ((get_user_role() = 'admin'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.school_id = get_user_school_id()))));
CREATE POLICY "Teacher can read class student certifications" ON student_rub_certifications FOR SELECT USING ((get_user_role() = 'teacher'::text) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can certify class students" ON student_rub_certifications FOR INSERT WITH CHECK ((get_user_role() = 'teacher'::text) AND (certified_by = auth.uid()) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can update class student certifications" ON student_rub_certifications FOR UPDATE USING ((get_user_role() = 'teacher'::text) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can delete class student certifications" ON student_rub_certifications FOR DELETE USING ((get_user_role() = 'teacher'::text) AND (certified_by = auth.uid()) AND (student_id IN ( SELECT s.id FROM (students s JOIN classes c ON ((s.class_id = c.id))) WHERE (c.teacher_id = auth.uid()))));
CREATE POLICY "Student can read own certifications" ON student_rub_certifications FOR SELECT USING ((get_user_role() = 'student'::text) AND (student_id = auth.uid()));
CREATE POLICY "Parent can read children certifications" ON student_rub_certifications FOR SELECT USING ((get_user_role() = 'parent'::text) AND (student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))));

-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.
-- session_recitation_plans (11 policies)
ALTER TABLE session_recitation_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all school recitation plans" ON session_recitation_plans FOR ALL USING ((school_id = get_user_school_id()) AND (get_user_role() = 'admin'::text));
CREATE POLICY "Teacher can read school recitation plans" ON session_recitation_plans FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text));
CREATE POLICY "Teacher can insert recitation plans for own sessions" ON session_recitation_plans FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text) AND (set_by = auth.uid()) AND (scheduled_session_id IN ( SELECT scheduled_sessions.id FROM scheduled_sessions WHERE (scheduled_sessions.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can update recitation plans for own sessions" ON session_recitation_plans FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text) AND (scheduled_session_id IN ( SELECT scheduled_sessions.id FROM scheduled_sessions WHERE (scheduled_sessions.teacher_id = auth.uid()))));
CREATE POLICY "Teacher can delete recitation plans for own sessions" ON session_recitation_plans FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'teacher'::text) AND (scheduled_session_id IN ( SELECT scheduled_sessions.id FROM scheduled_sessions WHERE (scheduled_sessions.teacher_id = auth.uid()))));
CREATE POLICY "Student can read own recitation plans" ON session_recitation_plans FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'student'::text) AND ((student_id = auth.uid()) OR ((student_id IS NULL) AND (scheduled_session_id IN ( SELECT ss.id FROM scheduled_sessions ss WHERE ((ss.student_id = auth.uid()) OR ((ss.session_type = 'class'::text) AND (ss.class_id IN ( SELECT students.class_id FROM students WHERE (students.id = auth.uid()))))))))));
CREATE POLICY "Student can insert own recitation plans" ON session_recitation_plans FOR INSERT WITH CHECK ((school_id = get_user_school_id()) AND (get_user_role() = 'student'::text) AND (student_id = auth.uid()) AND (set_by = auth.uid()));
CREATE POLICY "Student can update own recitation plans" ON session_recitation_plans FOR UPDATE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'student'::text) AND (student_id = auth.uid()) AND (set_by = auth.uid()));
CREATE POLICY "Student can delete own recitation plans" ON session_recitation_plans FOR DELETE USING ((school_id = get_user_school_id()) AND (get_user_role() = 'student'::text) AND (student_id = auth.uid()) AND (set_by = auth.uid()));
CREATE POLICY "Parent can read children recitation plans" ON session_recitation_plans FOR SELECT USING ((school_id = get_user_school_id()) AND (get_user_role() = 'parent'::text) AND ((student_id IN ( SELECT students.id FROM students WHERE (students.parent_id = auth.uid()))) OR ((student_id IS NULL) AND (scheduled_session_id IN ( SELECT ss.id FROM scheduled_sessions ss WHERE ((ss.session_type = 'class'::text) AND (ss.class_id IN ( SELECT students.class_id FROM students WHERE (students.parent_id = auth.uid())))))))));

-- =============================================================================
-- Section 6: Triggers (14 active)
-- =============================================================================

-- Updated at triggers
CREATE TRIGGER set_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_class_schedules_updated_at BEFORE UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_memorization_assignments_updated_at BEFORE UPDATE ON memorization_assignments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_memorization_progress_updated_at BEFORE UPDATE ON memorization_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_push_tokens_updated_at BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_scheduled_sessions_updated_at BEFORE UPDATE ON scheduled_sessions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_session_recitation_plans_updated_at BEFORE UPDATE ON session_recitation_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_rub_certifications_updated_at BEFORE UPDATE ON student_rub_certifications FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_teacher_work_schedules_updated_at BEFORE UPDATE ON teacher_work_schedules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auth trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Notification triggers
CREATE TRIGGER on_attendance_insert AFTER INSERT ON attendance FOR EACH ROW EXECUTE FUNCTION notify_on_insert();
CREATE TRIGGER on_session_insert AFTER INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION notify_on_insert();

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
