-- =============================================================================
-- Quran School — Consolidated Schema Migration
-- =============================================================================
-- This single migration creates the entire database schema from scratch.
-- It includes: extensions, tables, functions, indexes, RLS policies,
-- triggers, realtime publication, cron jobs, and seed data.
-- =============================================================================

-- =============================================================================
-- Section 1: Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- =============================================================================
-- Section 2: Tables (20 tables in FK dependency order)
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
$$;

CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      (NEW.raw_user_meta_data->>'name_localized')::JSONB,
      jsonb_build_object('en', COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    )
  );
  RETURN NEW;
END;
$$;

-- 3b. Utility Functions

CREATE OR REPLACE FUNCTION resolve_localized_name(localized jsonb, fallback text, lang text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF localized IS NOT NULL AND localized ? lang THEN
    RETURN localized ->> lang;
  END IF;
  IF localized IS NOT NULL AND localized ? 'en' THEN
    RETURN localized ->> 'en';
  END IF;
  IF localized IS NOT NULL AND localized != '{}' THEN
    RETURN (SELECT value FROM jsonb_each_text(localized) LIMIT 1);
  END IF;
  RETURN fallback;
END;
$$;

-- NOTE: Update the URL below when deploying to a new Supabase project
CREATE OR REPLACE FUNCTION notify_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
BEGIN
  edge_function_url := 'https://cwakivlyvnxdeqrkbzxc.supabase.co/functions/v1/send-notification';

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', NULL
  );

  PERFORM extensions.http_post(
    url := edge_function_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_review_count(cert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE student_rub_certifications
  SET review_count = review_count + 1,
      last_reviewed_at = now(),
      dormant_since = NULL,
      updated_at = now()
  WHERE id = cert_id;
END;
$$;

-- 3c. RPC Report Functions

CREATE OR REPLACE FUNCTION get_attendance_trend(p_school_id uuid, p_start_date date, p_end_date date, p_granularity text, p_class_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(bucket_date date, present_count bigint, absent_count bigint, late_count bigint, excused_count bigint, attendance_rate numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    date_trunc(p_granularity, a.date)::DATE AS bucket_date,
    COUNT(*) FILTER (WHERE a.status = 'present') AS present_count,
    COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_count,
    COUNT(*) FILTER (WHERE a.status = 'late') AS late_count,
    COUNT(*) FILTER (WHERE a.status = 'excused') AS excused_count,
    ROUND(
      (COUNT(*) FILTER (WHERE a.status = 'present') + COUNT(*) FILTER (WHERE a.status = 'late'))::NUMERIC
      / NULLIF(
          (COUNT(*) FILTER (WHERE a.status = 'present')
           + COUNT(*) FILTER (WHERE a.status = 'absent')
           + COUNT(*) FILTER (WHERE a.status = 'late')),
          0
        )
      * 100,
      1
    ) AS attendance_rate
  FROM attendance a
  WHERE a.school_id = p_school_id
    AND a.date >= p_start_date
    AND a.date <= p_end_date
    AND (p_class_id IS NULL OR a.class_id = p_class_id)
  GROUP BY bucket_date
  ORDER BY bucket_date;
$function$;

CREATE OR REPLACE FUNCTION get_score_trend(p_school_id uuid, p_start_date date, p_end_date date, p_granularity text, p_class_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(bucket_date date, avg_memorization numeric, avg_tajweed numeric, avg_recitation numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    date_trunc(p_granularity, s.session_date)::DATE AS bucket_date,
    ROUND(AVG(s.memorization_score)::NUMERIC, 2) AS avg_memorization,
    ROUND(AVG(s.tajweed_score)::NUMERIC, 2) AS avg_tajweed,
    ROUND(AVG(s.recitation_quality)::NUMERIC, 2) AS avg_recitation
  FROM sessions s
  WHERE s.school_id = p_school_id
    AND s.session_date >= p_start_date
    AND s.session_date <= p_end_date
    AND (p_class_id IS NULL OR s.class_id = p_class_id)
    AND (s.memorization_score IS NOT NULL
         OR s.tajweed_score IS NOT NULL
         OR s.recitation_quality IS NOT NULL)
  GROUP BY bucket_date
  ORDER BY bucket_date;
$function$;

CREATE OR REPLACE FUNCTION get_teacher_activity(p_school_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(teacher_id uuid, full_name text, avatar_url text, sessions_logged bigint, unique_students bigint, stickers_awarded bigint, last_active_date date)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id AS teacher_id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT s.id) AS sessions_logged,
    COUNT(DISTINCT s.student_id) AS unique_students,
    COUNT(DISTINCT ss.id) AS stickers_awarded,
    MAX(s.session_date) AS last_active_date
  FROM profiles p
  LEFT JOIN sessions s
    ON s.teacher_id = p.id
    AND s.session_date >= p_start_date
    AND s.session_date <= p_end_date
  LEFT JOIN student_stickers ss
    ON ss.awarded_by = p.id
    AND ss.awarded_at >= p_start_date::TIMESTAMPTZ
    AND ss.awarded_at < (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  WHERE p.school_id = p_school_id
    AND p.role = 'teacher'
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY sessions_logged DESC, p.full_name ASC;
$function$;

CREATE OR REPLACE FUNCTION get_students_needing_attention(p_class_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS TABLE(student_id uuid, full_name text, avatar_url text, current_avg numeric, previous_avg numeric, decline_amount numeric, flag_reason text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked_sessions AS (
    SELECT
      s.student_id,
      s.memorization_score,
      s.tajweed_score,
      s.recitation_quality,
      s.session_date,
      ROW_NUMBER() OVER (
        PARTITION BY s.student_id
        ORDER BY s.session_date DESC, s.created_at DESC
      ) AS rn
    FROM sessions s
    INNER JOIN students st ON st.id = s.student_id
    WHERE st.class_id = p_class_id
      AND (p_start_date IS NULL OR s.session_date >= p_start_date)
      AND (p_end_date IS NULL OR s.session_date <= p_end_date)
      AND (s.memorization_score IS NOT NULL
           OR s.tajweed_score IS NOT NULL
           OR s.recitation_quality IS NOT NULL)
  ),
  student_avgs AS (
    SELECT
      rs.student_id,
      AVG(
        CASE WHEN rs.rn <= 3 THEN
          (COALESCE(rs.memorization_score, 0)
           + COALESCE(rs.tajweed_score, 0)
           + COALESCE(rs.recitation_quality, 0))::NUMERIC
          / NULLIF(
              (CASE WHEN rs.memorization_score IS NOT NULL THEN 1 ELSE 0 END
               + CASE WHEN rs.tajweed_score IS NOT NULL THEN 1 ELSE 0 END
               + CASE WHEN rs.recitation_quality IS NOT NULL THEN 1 ELSE 0 END),
              0
            )
        END
      ) AS curr_avg,
      AVG(
        CASE WHEN rs.rn BETWEEN 4 AND 6 THEN
          (COALESCE(rs.memorization_score, 0)
           + COALESCE(rs.tajweed_score, 0)
           + COALESCE(rs.recitation_quality, 0))::NUMERIC
          / NULLIF(
              (CASE WHEN rs.memorization_score IS NOT NULL THEN 1 ELSE 0 END
               + CASE WHEN rs.tajweed_score IS NOT NULL THEN 1 ELSE 0 END
               + CASE WHEN rs.recitation_quality IS NOT NULL THEN 1 ELSE 0 END),
              0
            )
        END
      ) AS prev_avg,
      BOOL_OR(
        CASE WHEN rs.rn <= 2 THEN
          (rs.memorization_score IS NOT NULL AND rs.memorization_score < 3)
          OR (rs.tajweed_score IS NOT NULL AND rs.tajweed_score < 3)
          OR (rs.recitation_quality IS NOT NULL AND rs.recitation_quality < 3)
        ELSE FALSE END
      ) AS has_low_recent,
      COUNT(*) FILTER (WHERE rs.rn <= 3) AS session_count
    FROM ranked_sessions rs
    WHERE rs.rn <= 6
    GROUP BY rs.student_id
  )
  SELECT
    sa.student_id,
    p.full_name,
    p.avatar_url,
    ROUND(sa.curr_avg, 2) AS current_avg,
    ROUND(COALESCE(sa.prev_avg, 0), 2) AS previous_avg,
    ROUND(COALESCE(sa.prev_avg - sa.curr_avg, 0), 2) AS decline_amount,
    CASE
      WHEN sa.session_count >= 3 AND sa.prev_avg IS NOT NULL AND sa.curr_avg < sa.prev_avg
        THEN 'declining'
      WHEN sa.has_low_recent
        THEN 'low_scores'
      ELSE NULL
    END AS flag_reason
  FROM student_avgs sa
  INNER JOIN profiles p ON p.id = sa.student_id
  WHERE (
    (sa.session_count >= 3 AND sa.prev_avg IS NOT NULL AND sa.curr_avg < sa.prev_avg)
    OR sa.has_low_recent
  )
  ORDER BY decline_amount DESC
  LIMIT 10;
END;
$function$;

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

ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE memorization_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE recitations;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_recitation_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE student_stickers;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_checkins;

-- =============================================================================
-- Section 8: Cron Jobs
-- =============================================================================

-- NOTE: Update the URLs below when deploying to a new Supabase project
SELECT cron.schedule(
  'generate-sessions',
  '*/15 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://cwakivlyvnxdeqrkbzxc.supabase.co/functions/v1/generate-sessions',
    body := '{"time": "' || now()::text || '"}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'teacher-daily-summary',
  '*/15 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://cwakivlyvnxdeqrkbzxc.supabase.co/functions/v1/teacher-daily-summary',
    body := '{"time": "' || now()::text || '"}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- =============================================================================
-- Section 9: Seed Data
-- =============================================================================

-- 9a. Quran Rub Reference (240 rows)
INSERT INTO quran_rub_reference (rub_number, juz_number, hizb_number, quarter_in_hizb, start_surah, start_ayah, end_surah, end_ayah) VALUES
(1,1,1,1,1,1,2,25),
(2,1,1,2,2,26,2,43),
(3,1,1,3,2,44,2,59),
(4,1,1,4,2,60,2,74),
(5,1,2,1,2,75,2,91),
(6,1,2,2,2,92,2,105),
(7,1,2,3,2,106,2,123),
(8,1,2,4,2,124,2,141),
(9,2,3,1,2,142,2,157),
(10,2,3,2,2,158,2,176),
(11,2,3,3,2,177,2,188),
(12,2,3,4,2,189,2,202),
(13,2,4,1,2,203,2,218),
(14,2,4,2,2,219,2,232),
(15,2,4,3,2,233,2,242),
(16,2,4,4,2,243,2,252),
(17,3,5,1,2,253,2,262),
(18,3,5,2,2,263,2,271),
(19,3,5,3,2,272,2,282),
(20,3,5,4,2,283,3,14),
(21,3,6,1,3,15,3,32),
(22,3,6,2,3,33,3,51),
(23,3,6,3,3,52,3,74),
(24,3,6,4,3,75,3,92),
(25,4,7,1,3,93,3,112),
(26,4,7,2,3,113,3,132),
(27,4,7,3,3,133,3,152),
(28,4,7,4,3,153,3,170),
(29,4,8,1,3,171,3,185),
(30,4,8,2,3,186,3,200),
(31,4,8,3,4,1,4,11),
(32,4,8,4,4,12,4,23),
(33,5,9,1,4,24,4,35),
(34,5,9,2,4,36,4,57),
(35,5,9,3,4,58,4,73),
(36,5,9,4,4,74,4,87),
(37,5,10,1,4,88,4,99),
(38,5,10,2,4,100,4,113),
(39,5,10,3,4,114,4,134),
(40,5,10,4,4,135,4,147),
(41,6,11,1,4,148,4,162),
(42,6,11,2,4,163,4,176),
(43,6,11,3,5,1,5,11),
(44,6,11,4,5,12,5,26),
(45,6,12,1,5,27,5,40),
(46,6,12,2,5,41,5,50),
(47,6,12,3,5,51,5,66),
(48,6,12,4,5,67,5,81),
(49,7,13,1,5,82,5,96),
(50,7,13,2,5,97,5,108),
(51,7,13,3,5,109,6,12),
(52,7,13,4,6,13,6,35),
(53,7,14,1,6,36,6,58),
(54,7,14,2,6,59,6,73),
(55,7,14,3,6,74,6,94),
(56,7,14,4,6,95,6,110),
(57,8,15,1,6,111,6,126),
(58,8,15,2,6,127,6,140),
(59,8,15,3,6,141,6,150),
(60,8,15,4,6,151,6,165),
(61,8,16,1,7,1,7,30),
(62,8,16,2,7,31,7,46),
(63,8,16,3,7,47,7,64),
(64,8,16,4,7,65,7,87),
(65,9,17,1,7,88,7,116),
(66,9,17,2,7,117,7,141),
(67,9,17,3,7,142,7,155),
(68,9,17,4,7,156,7,170),
(69,9,18,1,7,171,7,188),
(70,9,18,2,7,189,7,206),
(71,9,18,3,8,1,8,21),
(72,9,18,4,8,22,8,40),
(73,10,19,1,8,41,8,60),
(74,10,19,2,8,61,8,75),
(75,10,19,3,9,1,9,18),
(76,10,19,4,9,19,9,33),
(77,10,20,1,9,34,9,45),
(78,10,20,2,9,46,9,59),
(79,10,20,3,9,60,9,74),
(80,10,20,4,9,75,9,92),
(81,11,21,1,9,93,9,110),
(82,11,21,2,9,111,9,121),
(83,11,21,3,9,122,10,10),
(84,11,21,4,10,11,10,25),
(85,11,22,1,10,26,10,52),
(86,11,22,2,10,53,10,70),
(87,11,22,3,10,71,10,89),
(88,11,22,4,10,90,11,5),
(89,12,23,1,11,6,11,23),
(90,12,23,2,11,24,11,40),
(91,12,23,3,11,41,11,60),
(92,12,23,4,11,61,11,83),
(93,12,24,1,11,84,11,107),
(94,12,24,2,11,108,12,6),
(95,12,24,3,12,7,12,29),
(96,12,24,4,12,30,12,52),
(97,13,25,1,12,53,12,76),
(98,13,25,2,12,77,12,100),
(99,13,25,3,12,101,13,4),
(100,13,25,4,13,5,13,18),
(101,13,26,1,13,19,13,34),
(102,13,26,2,13,35,14,9),
(103,13,26,3,14,10,14,27),
(104,13,26,4,14,28,14,52),
(105,14,27,1,15,1,15,49),
(106,14,27,2,15,50,15,99),
(107,14,27,3,16,1,16,29),
(108,14,27,4,16,30,16,50),
(109,14,28,1,16,51,16,74),
(110,14,28,2,16,75,16,89),
(111,14,28,3,16,90,16,110),
(112,14,28,4,16,111,16,128),
(113,15,29,1,17,1,17,22),
(114,15,29,2,17,23,17,49),
(115,15,29,3,17,50,17,69),
(116,15,29,4,17,70,17,98),
(117,15,30,1,17,99,18,16),
(118,15,30,2,18,17,18,31),
(119,15,30,3,18,32,18,50),
(120,15,30,4,18,51,18,74),
(121,16,31,1,18,75,18,98),
(122,16,31,2,18,99,19,21),
(123,16,31,3,19,22,19,58),
(124,16,31,4,19,59,19,98),
(125,16,32,1,20,1,20,54),
(126,16,32,2,20,55,20,82),
(127,16,32,3,20,83,20,110),
(128,16,32,4,20,111,20,135),
(129,17,33,1,21,1,21,28),
(130,17,33,2,21,29,21,50),
(131,17,33,3,21,51,21,82),
(132,17,33,4,21,83,21,112),
(133,17,34,1,22,1,22,18),
(134,17,34,2,22,19,22,37),
(135,17,34,3,22,38,22,59),
(136,17,34,4,22,60,22,78),
(137,18,35,1,23,1,23,35),
(138,18,35,2,23,36,23,74),
(139,18,35,3,23,75,23,118),
(140,18,35,4,24,1,24,20),
(141,18,36,1,24,21,24,34),
(142,18,36,2,24,35,24,52),
(143,18,36,3,24,53,24,64),
(144,18,36,4,25,1,25,20),
(145,19,37,1,25,21,25,52),
(146,19,37,2,25,53,25,77),
(147,19,37,3,26,1,26,51),
(148,19,37,4,26,52,26,110),
(149,19,38,1,26,111,26,180),
(150,19,38,2,26,181,26,227),
(151,19,38,3,27,1,27,26),
(152,19,38,4,27,27,27,55),
(153,20,39,1,27,56,27,81),
(154,20,39,2,27,82,28,11),
(155,20,39,3,28,12,28,28),
(156,20,39,4,28,29,28,50),
(157,20,40,1,28,51,28,75),
(158,20,40,2,28,76,28,88),
(159,20,40,3,29,1,29,25),
(160,20,40,4,29,26,29,45),
(161,21,41,1,29,46,29,69),
(162,21,41,2,30,1,30,30),
(163,21,41,3,30,31,30,53),
(164,21,41,4,30,54,31,21),
(165,21,42,1,31,22,32,10),
(166,21,42,2,32,11,32,30),
(167,21,42,3,33,1,33,17),
(168,21,42,4,33,18,33,30),
(169,22,43,1,33,31,33,50),
(170,22,43,2,33,51,33,59),
(171,22,43,3,33,60,34,9),
(172,22,43,4,34,10,34,23),
(173,22,44,1,34,24,34,45),
(174,22,44,2,34,46,35,14),
(175,22,44,3,35,15,35,40),
(176,22,44,4,35,41,36,27),
(177,23,45,1,36,28,36,59),
(178,23,45,2,36,60,37,21),
(179,23,45,3,37,22,37,82),
(180,23,45,4,37,83,37,144),
(181,23,46,1,37,145,38,20),
(182,23,46,2,38,21,38,51),
(183,23,46,3,38,52,39,7),
(184,23,46,4,39,8,39,31),
(185,24,47,1,39,32,39,52),
(186,24,47,2,39,53,39,75),
(187,24,47,3,40,1,40,20),
(188,24,47,4,40,21,40,40),
(189,24,48,1,40,41,40,65),
(190,24,48,2,40,66,41,8),
(191,24,48,3,41,9,41,24),
(192,24,48,4,41,25,41,46),
(193,25,49,1,41,47,42,12),
(194,25,49,2,42,13,42,26),
(195,25,49,3,42,27,42,50),
(196,25,49,4,42,51,43,23),
(197,25,50,1,43,24,43,56),
(198,25,50,2,43,57,44,16),
(199,25,50,3,44,17,45,11),
(200,25,50,4,45,12,45,37),
(201,26,51,1,46,1,46,20),
(202,26,51,2,46,21,47,9),
(203,26,51,3,47,10,47,32),
(204,26,51,4,47,33,48,17),
(205,26,52,1,48,18,48,29),
(206,26,52,2,49,1,49,13),
(207,26,52,3,49,14,50,26),
(208,26,52,4,50,27,51,30),
(209,27,53,1,51,31,52,23),
(210,27,53,2,52,24,53,25),
(211,27,53,3,53,26,54,8),
(212,27,53,4,54,9,54,55),
(213,27,54,1,55,1,55,78),
(214,27,54,2,56,1,56,74),
(215,27,54,3,56,75,57,15),
(216,27,54,4,57,16,57,29),
(217,28,55,1,58,1,58,13),
(218,28,55,2,58,14,59,10),
(219,28,55,3,59,11,60,6),
(220,28,55,4,60,7,61,14),
(221,28,56,1,62,1,63,3),
(222,28,56,2,63,4,64,18),
(223,28,56,3,65,1,65,12),
(224,28,56,4,66,1,66,12),
(225,29,57,1,67,1,67,30),
(226,29,57,2,68,1,68,52),
(227,29,57,3,69,1,70,18),
(228,29,57,4,70,19,71,28),
(229,29,58,1,72,1,73,19),
(230,29,58,2,73,20,74,56),
(231,29,58,3,75,1,76,18),
(232,29,58,4,76,19,77,50),
(233,30,59,1,78,1,79,46),
(234,30,59,2,80,1,81,29),
(235,30,59,3,82,1,83,36),
(236,30,59,4,84,1,86,17),
(237,30,60,1,87,1,89,30),
(238,30,60,2,90,1,93,11),
(239,30,60,3,94,1,100,8),
(240,30,60,4,100,9,114,6);

-- 9b. Stickers (38 rows)
INSERT INTO stickers (id, name_ar, name_en, tier, image_path) VALUES
('dates-and-milk', 'التمر واللبن', 'Dates & Milk', 'bronze', 'dates-and-milk.png'),
('decorative-column', 'العمود', 'Decorative Column', 'bronze', 'decorative-column.png'),
('holy-quran', 'المصحف الشريف', 'Holy Quran', 'bronze', 'holy-quran.png'),
('memorization-tablet', 'لوح المحفوظ', 'Memorization Tablet', 'bronze', 'memorization-tablet.png'),
('mosque', 'المسجد', 'Mosque', 'bronze', 'mosque.png'),
('ornate-key', 'المفتاح', 'Ornate Key', 'bronze', 'ornate-key.png'),
('prayer-beads', 'المسبحة', 'Prayer Beads', 'bronze', 'prayer-beads.png'),
('prayer-rug', 'سجادة الصلاة', 'Prayer Rug', 'bronze', 'prayer-rug.png'),
('quill-and-inkwell', 'القلم والمحبرة', 'Quill & Inkwell', 'bronze', 'quill-and-inkwell.png'),
('salah-eldins-eagle-v3', 'نسر صلاح الدين', 'Salah El-Din''s Eagle', 'bronze', 'salah-eldins-eagle-v3.png'),
('traditional-lantern', 'الفانوس', 'Traditional Lantern', 'bronze', 'traditional-lantern.png'),
('arabesque-arch', 'بوابة الأرابيسك', 'Arabesque Arch', 'silver', 'arabesque-arch.png'),
('astrolabe-v2', 'الأسطرلاب', 'Astrolabe', 'silver', 'astrolabe-v2.png'),
('compass', 'البوصلة', 'Compass', 'silver', 'compass.png'),
('house-of-wisdom-scroll-v2', 'بيت الحكمة', 'House of Wisdom Scroll', 'silver', 'house-of-wisdom-scroll-v2.png'),
('islamic-dome', 'القبة', 'Islamic Dome', 'silver', 'islamic-dome.png'),
('kufic-calligraphy', 'الخط الكوفي', 'Kufic Calligraphy', 'silver', 'kufic-calligraphy.png'),
('minaret-v2', 'المئذنة', 'Minaret', 'silver', 'minaret-v2.png'),
('mishkat-lamp', 'المشكاة', 'Mishkat Lamp', 'silver', 'mishkat-lamp.png'),
('noahs-ark', 'السفينة', 'Noah''s Ark', 'silver', 'noahs-ark.png'),
('dhul-fiqar-sword', 'ذو الفقار', 'Dhul Fiqar Sword', 'gold', 'dhul-fiqar-sword.png'),
('dome-of-the-rock', 'قبة الصخرة', 'Dome of the Rock', 'gold', 'dome-of-the-rock.png'),
('gate-of-peace', 'باب السلام', 'Gate of Peace', 'gold', 'gate-of-peace.png'),
('islamic-dinar', 'الدرهم الإسلامي', 'Islamic Dinar', 'gold', 'islamic-dinar.png'),
('muqarnas', 'المقرنصات', 'Muqarnas', 'gold', 'muqarnas.png'),
('prophets-minbar-v2', 'المنبر النبوي', 'Prophet''s Minbar', 'gold', 'prophets-minbar-v2.png'),
('salihs-camel', 'الناقة', 'Salih''s Camel', 'gold', 'salihs-camel.png'),
('staff-of-musa', 'عصا موسى', 'Staff of Musa', 'gold', 'staff-of-musa.png'),
('the-kaaba', 'الكعبة المشرفة', 'The Kaaba', 'gold', 'the-kaaba.png'),
('zamzam-well', 'عين زمزم', 'Zamzam Well', 'gold', 'zamzam-well.png'),
('seal-of-prophethood', 'خاتم النبوة', 'Seal of Prophethood', 'diamond', 'seal-of-prophethood.png'),
('the-rawdah', 'الروضة الشريفة', 'The Rawdah', 'diamond', 'the-rawdah.png'),
('eid-cookies', 'كعك العيد', 'Eid Cookies', 'seasonal', 'eid-cookies.png'),
('eid-lamb', 'خروف العيد', 'Eid Lamb', 'seasonal', 'eid-lamb.png'),
('kiswah-cloth', 'كسوة الكعبة', 'Kiswah Cloth', 'seasonal', 'kiswah-cloth.png'),
('ramadan-cannon', 'مدفع رمضان', 'Ramadan Cannon', 'seasonal', 'ramadan-cannon.png'),
('ramadan-crescent', 'هلال رمضان', 'Ramadan Crescent', 'seasonal', 'ramadan-crescent.png'),
('tent-of-arafah', 'خيمة عرفة', 'Tent of Arafah', 'seasonal', 'tent-of-arafah.png');
