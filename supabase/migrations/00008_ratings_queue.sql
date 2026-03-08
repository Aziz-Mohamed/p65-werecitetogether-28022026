-- =============================================================================
-- Migration: Ratings & Queue System
-- Feature: 006-ratings-queue
-- Date: 2026-03-06
-- Description: 5 new tables (teacher_ratings, teacher_rating_stats,
--   rating_exclusion_log, program_queue_entries, daily_session_counts),
--   ALTER programs (+daily_session_limit, +queue_notification_threshold),
--   ALTER notification_preferences (+6 boolean columns),
--   11 RPC functions, 3 triggers, 4 pg_cron jobs, RLS policies, Realtime.
-- =============================================================================

SET search_path = public;

-- =============================================================================
-- Section 1: ALTER existing tables
-- =============================================================================

-- Programs: add fair usage and queue config
ALTER TABLE programs ADD COLUMN IF NOT EXISTS daily_session_limit INTEGER DEFAULT 2;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS queue_notification_threshold INTEGER DEFAULT 5;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_daily_session_limit_check'
  ) THEN
    ALTER TABLE programs ADD CONSTRAINT programs_daily_session_limit_check
      CHECK (daily_session_limit >= 1);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'programs_queue_notification_threshold_check'
  ) THEN
    ALTER TABLE programs ADD CONSTRAINT programs_queue_notification_threshold_check
      CHECK (queue_notification_threshold >= 1);
  END IF;
END $$;

-- Notification preferences: add 6 new category columns
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS rating_prompt BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS low_rating_alert BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS flagged_review_alert BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS queue_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS teacher_demand BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS recovered_alert BOOLEAN NOT NULL DEFAULT true;

-- =============================================================================
-- Section 2: CREATE teacher_ratings table
-- =============================================================================

CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  star_rating INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT CHECK (char_length(comment) <= 500),
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One rating per session per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_ratings_session_student
  ON teacher_ratings (session_id, student_id);

-- Aggregate queries (teacher stats)
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher_program
  ON teacher_ratings (teacher_id, program_id);

-- Supervisor flagged review list
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_flagged
  ON teacher_ratings (program_id) WHERE is_flagged = true AND is_excluded = false;

-- Session already rated check
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_session
  ON teacher_ratings (session_id);

-- =============================================================================
-- Section 3: CREATE teacher_rating_stats table
-- =============================================================================

CREATE TABLE IF NOT EXISTS teacher_rating_stats (
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  star_distribution JSONB NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  common_positive_tags TEXT[] DEFAULT '{}',
  common_constructive_tags TEXT[] DEFAULT '{}',
  trend_direction TEXT CHECK (trend_direction IN ('improving','declining','stable')),
  last_30_days_avg NUMERIC(3,2) DEFAULT 0,
  prior_30_days_avg NUMERIC(3,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, program_id)
);

-- Available-now list: teachers with 5+ reviews
CREATE INDEX IF NOT EXISTS idx_rating_stats_program
  ON teacher_rating_stats (program_id) WHERE total_reviews >= 5;

-- =============================================================================
-- Section 4: CREATE rating_exclusion_log table
-- =============================================================================

CREATE TABLE IF NOT EXISTS rating_exclusion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES teacher_ratings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('excluded','restored')),
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exclusion_log_rating
  ON rating_exclusion_log (rating_id);

-- =============================================================================
-- Section 5: CREATE program_queue_entries table
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','claimed','expired','left')),
  notified_at TIMESTAMPTZ,
  claim_expires_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active entry per student per program
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_entries_active
  ON program_queue_entries (program_id, student_id) WHERE status IN ('waiting','notified');

-- Queue processing order
CREATE INDEX IF NOT EXISTS idx_queue_entries_program_waiting
  ON program_queue_entries (program_id, position) WHERE status = 'waiting';

-- Student's active queues
CREATE INDEX IF NOT EXISTS idx_queue_entries_student
  ON program_queue_entries (student_id) WHERE status IN ('waiting','notified');

-- Cascade processing (expired claims)
CREATE INDEX IF NOT EXISTS idx_queue_entries_expiry
  ON program_queue_entries (claim_expires_at) WHERE status = 'notified';

-- Auto-expiry (2h timeout)
CREATE INDEX IF NOT EXISTS idx_queue_entries_auto_expiry
  ON program_queue_entries (expires_at) WHERE status IN ('waiting','notified');

-- =============================================================================
-- Section 6: CREATE daily_session_counts table
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_session_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_session_counts_unique UNIQUE (student_id, program_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_counts_lookup
  ON daily_session_counts (student_id, program_id, session_date);

-- =============================================================================
-- Section 7: RPC — submit_rating
-- =============================================================================

CREATE OR REPLACE FUNCTION submit_rating(
  p_session_id UUID,
  p_star_rating INTEGER,
  p_tags TEXT[] DEFAULT '{}',
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_existing UUID;
  v_rating teacher_ratings;
BEGIN
  -- Validate session exists
  SELECT s.id, s.student_id, s.teacher_id, s.status, s.created_at, s.program_id
  INTO v_session
  FROM sessions s
  WHERE s.id = p_session_id;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found' USING ERRCODE = 'P0001';
  END IF;

  -- Validate session is completed
  IF v_session.status != 'completed' THEN
    RAISE EXCEPTION 'Session not completed' USING ERRCODE = 'P0001';
  END IF;

  -- Validate within 48h window (from session completion/created_at)
  IF v_session.created_at < now() - interval '48 hours' THEN
    RAISE EXCEPTION 'Rating window expired' USING ERRCODE = 'P0001';
  END IF;

  -- Validate caller is the student
  IF v_session.student_id != auth.uid() THEN
    RAISE EXCEPTION 'Not your session' USING ERRCODE = 'P0001';
  END IF;

  -- Check for existing rating
  SELECT id INTO v_existing
  FROM teacher_ratings
  WHERE session_id = p_session_id AND student_id = auth.uid();

  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already rated' USING ERRCODE = 'P0001';
  END IF;

  -- Insert rating
  INSERT INTO teacher_ratings (session_id, student_id, teacher_id, program_id, star_rating, tags, comment, is_flagged)
  VALUES (
    p_session_id,
    auth.uid(),
    v_session.teacher_id,
    v_session.program_id,
    p_star_rating,
    p_tags,
    p_comment,
    p_star_rating <= 2
  )
  RETURNING * INTO v_rating;

  RETURN to_jsonb(v_rating);
END;
$$;

-- =============================================================================
-- Section 8: RPC — get_teacher_rating_stats
-- =============================================================================

CREATE OR REPLACE FUNCTION get_teacher_rating_stats(
  p_teacher_id UUID,
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats teacher_rating_stats;
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  SELECT * INTO v_stats
  FROM teacher_rating_stats
  WHERE teacher_id = p_teacher_id AND program_id = p_program_id;

  IF v_stats IS NULL THEN
    RETURN NULL;
  END IF;

  -- Students only see stats if 5+ reviews
  IF v_caller_role = 'student' AND v_stats.total_reviews < 5 THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_stats);
END;
$$;

-- =============================================================================
-- Section 9: RPC — exclude_rating
-- =============================================================================

CREATE OR REPLACE FUNCTION exclude_rating(
  p_rating_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rating teacher_ratings;
  v_caller_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_rating FROM teacher_ratings WHERE id = p_rating_id;
  IF v_rating IS NULL THEN
    RAISE EXCEPTION 'Rating not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_rating.is_excluded THEN
    RAISE EXCEPTION 'Already excluded' USING ERRCODE = 'P0001';
  END IF;

  -- Check caller is supervisor for the rating's program
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  SELECT EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = v_rating.program_id
      AND role = 'supervisor'
  ) INTO v_has_access;

  IF v_caller_role NOT IN ('master_admin') AND NOT v_has_access THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = 'P0001';
  END IF;

  -- Exclude
  UPDATE teacher_ratings SET is_excluded = true WHERE id = p_rating_id;

  -- Log
  INSERT INTO rating_exclusion_log (rating_id, action, performed_by, reason)
  VALUES (p_rating_id, 'excluded', auth.uid(), trim(p_reason));

  RETURN jsonb_build_object('success', true, 'rating_id', p_rating_id, 'is_excluded', true);
END;
$$;

-- =============================================================================
-- Section 10: RPC — restore_rating
-- =============================================================================

CREATE OR REPLACE FUNCTION restore_rating(
  p_rating_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rating teacher_ratings;
  v_caller_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_rating FROM teacher_ratings WHERE id = p_rating_id;
  IF v_rating IS NULL THEN
    RAISE EXCEPTION 'Rating not found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_rating.is_excluded THEN
    RAISE EXCEPTION 'Not excluded' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  SELECT EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = v_rating.program_id
      AND role = 'supervisor'
  ) INTO v_has_access;

  IF v_caller_role NOT IN ('master_admin') AND NOT v_has_access THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = 'P0001';
  END IF;

  UPDATE teacher_ratings SET is_excluded = false WHERE id = p_rating_id;

  INSERT INTO rating_exclusion_log (rating_id, action, performed_by, reason)
  VALUES (p_rating_id, 'restored', auth.uid(), trim(p_reason));

  RETURN jsonb_build_object('success', true, 'rating_id', p_rating_id, 'is_excluded', false);
END;
$$;

-- =============================================================================
-- Section 11: RPC — recalculate_teacher_stats (trigger helper)
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_teacher_stats(
  p_teacher_id UUID,
  p_program_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC(3,2);
  v_total INTEGER;
  v_dist JSONB;
  v_positive TEXT[];
  v_constructive TEXT[];
  v_last30 NUMERIC(3,2);
  v_prior30 NUMERIC(3,2);
  v_trend TEXT;
  v_old_avg NUMERIC(3,2);
  v_school_tz TEXT;
  v_now TIMESTAMPTZ;
BEGIN
  -- Get organization timezone
  SELECT COALESCE(s.timezone, 'UTC') INTO v_school_tz
  FROM schools s LIMIT 1;

  v_now := now() AT TIME ZONE v_school_tz;

  -- Calculate aggregates from non-excluded ratings
  SELECT
    COALESCE(AVG(star_rating), 0)::NUMERIC(3,2),
    COUNT(*)::INTEGER
  INTO v_avg, v_total
  FROM teacher_ratings
  WHERE teacher_id = p_teacher_id
    AND program_id = p_program_id
    AND is_excluded = false;

  -- Star distribution
  SELECT jsonb_build_object(
    '1', COALESCE(SUM(CASE WHEN star_rating = 1 THEN 1 ELSE 0 END), 0),
    '2', COALESCE(SUM(CASE WHEN star_rating = 2 THEN 1 ELSE 0 END), 0),
    '3', COALESCE(SUM(CASE WHEN star_rating = 3 THEN 1 ELSE 0 END), 0),
    '4', COALESCE(SUM(CASE WHEN star_rating = 4 THEN 1 ELSE 0 END), 0),
    '5', COALESCE(SUM(CASE WHEN star_rating = 5 THEN 1 ELSE 0 END), 0)
  ) INTO v_dist
  FROM teacher_ratings
  WHERE teacher_id = p_teacher_id
    AND program_id = p_program_id
    AND is_excluded = false;

  -- Top 3 positive tags
  SELECT ARRAY(
    SELECT unnest(tags) AS tag
    FROM teacher_ratings
    WHERE teacher_id = p_teacher_id
      AND program_id = p_program_id
      AND is_excluded = false
      AND tags && ARRAY['patient','clear_explanation','encouraging','well_prepared','good_listener']
    GROUP BY tag
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) INTO v_positive;

  -- Top 3 constructive tags
  SELECT ARRAY(
    SELECT unnest(tags) AS tag
    FROM teacher_ratings
    WHERE teacher_id = p_teacher_id
      AND program_id = p_program_id
      AND is_excluded = false
      AND tags && ARRAY['session_felt_rushed','needs_more_practice','unclear_instructions','late_start']
    GROUP BY tag
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) INTO v_constructive;

  -- 30-day trend windows
  SELECT COALESCE(AVG(star_rating), 0)::NUMERIC(3,2) INTO v_last30
  FROM teacher_ratings
  WHERE teacher_id = p_teacher_id
    AND program_id = p_program_id
    AND is_excluded = false
    AND created_at >= (v_now - interval '30 days');

  SELECT COALESCE(AVG(star_rating), 0)::NUMERIC(3,2) INTO v_prior30
  FROM teacher_ratings
  WHERE teacher_id = p_teacher_id
    AND program_id = p_program_id
    AND is_excluded = false
    AND created_at >= (v_now - interval '60 days')
    AND created_at < (v_now - interval '30 days');

  -- Trend direction (0.2 threshold)
  IF v_last30 > v_prior30 + 0.2 THEN
    v_trend := 'improving';
  ELSIF v_last30 < v_prior30 - 0.2 THEN
    v_trend := 'declining';
  ELSE
    v_trend := 'stable';
  END IF;

  -- Get old average for threshold comparison
  SELECT average_rating INTO v_old_avg
  FROM teacher_rating_stats
  WHERE teacher_id = p_teacher_id AND program_id = p_program_id;

  -- Upsert stats
  INSERT INTO teacher_rating_stats (
    teacher_id, program_id, average_rating, total_reviews,
    star_distribution, common_positive_tags, common_constructive_tags,
    trend_direction, last_30_days_avg, prior_30_days_avg, updated_at
  ) VALUES (
    p_teacher_id, p_program_id, v_avg, v_total,
    v_dist, v_positive, v_constructive,
    v_trend, v_last30, v_prior30, now()
  )
  ON CONFLICT (teacher_id, program_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    star_distribution = EXCLUDED.star_distribution,
    common_positive_tags = EXCLUDED.common_positive_tags,
    common_constructive_tags = EXCLUDED.common_constructive_tags,
    trend_direction = EXCLUDED.trend_direction,
    last_30_days_avg = EXCLUDED.last_30_days_avg,
    prior_30_days_avg = EXCLUDED.prior_30_days_avg,
    updated_at = now();

  -- Check for low rating alert (avg drops below 3.5)
  IF v_old_avg IS NOT NULL AND v_old_avg >= 3.5 AND v_avg < 3.5 THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'low_rating_alert',
        'teacher_id', p_teacher_id,
        'program_id', p_program_id,
        'average_rating', v_avg
      )
    );
  END IF;

  -- Check for recovery alert (avg rises above 3.5)
  IF v_old_avg IS NOT NULL AND v_old_avg < 3.5 AND v_avg >= 3.5 THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'recovered_alert',
        'teacher_id', p_teacher_id,
        'program_id', p_program_id,
        'average_rating', v_avg
      )
    );
  END IF;
END;
$$;

-- =============================================================================
-- Section 12: RPC — get_teacher_reviews
-- =============================================================================

CREATE OR REPLACE FUNCTION get_teacher_reviews(
  p_teacher_id UUID,
  p_program_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_has_access BOOLEAN;
  v_offset INTEGER;
  v_total INTEGER;
  v_reviews JSONB;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  SELECT EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = p_program_id
      AND role IN ('supervisor', 'program_admin')
  ) INTO v_has_access;

  IF v_caller_role NOT IN ('master_admin') AND NOT v_has_access THEN
    RAISE EXCEPTION 'Insufficient permissions' USING ERRCODE = 'P0001';
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(*) INTO v_total
  FROM teacher_ratings
  WHERE teacher_id = p_teacher_id AND program_id = p_program_id;

  SELECT COALESCE(jsonb_agg(review_row), '[]'::jsonb) INTO v_reviews
  FROM (
    SELECT jsonb_build_object(
      'id', tr.id,
      'session_id', tr.session_id,
      'student_id', tr.student_id,
      'student_name', p.full_name,
      'star_rating', tr.star_rating,
      'tags', tr.tags,
      'comment', tr.comment,
      'is_flagged', tr.is_flagged,
      'is_excluded', tr.is_excluded,
      'created_at', tr.created_at,
      'exclusion_log', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'action', rel.action,
          'performed_by', rel.performed_by,
          'performer_name', pp.full_name,
          'reason', rel.reason,
          'created_at', rel.created_at
        ) ORDER BY rel.created_at)
        FROM rating_exclusion_log rel
        LEFT JOIN profiles pp ON pp.id = rel.performed_by
        WHERE rel.rating_id = tr.id
      ), '[]'::jsonb)
    ) AS review_row
    FROM teacher_ratings tr
    JOIN profiles p ON p.id = tr.student_id
    WHERE tr.teacher_id = p_teacher_id AND tr.program_id = p_program_id
    ORDER BY tr.created_at DESC
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'reviews', v_reviews,
    'total_count', v_total,
    'page', p_page,
    'page_size', p_page_size
  );
END;
$$;

-- =============================================================================
-- Section 13: RPC — join_queue
-- =============================================================================

CREATE OR REPLACE FUNCTION join_queue(
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program RECORD;
  v_existing UUID;
  v_enrolled BOOLEAN;
  v_position INTEGER;
  v_entry program_queue_entries;
  v_avg_duration INTEGER;
BEGIN
  -- Validate program
  SELECT id, category INTO v_program FROM programs WHERE id = p_program_id;
  IF v_program IS NULL THEN
    RAISE EXCEPTION 'Program not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_program.category != 'free' THEN
    RAISE EXCEPTION 'Not a free program' USING ERRCODE = 'P0001';
  END IF;

  -- Check enrollment
  SELECT EXISTS(
    SELECT 1 FROM enrollments
    WHERE program_id = p_program_id
      AND student_id = auth.uid()
      AND status = 'active'
  ) INTO v_enrolled;
  IF NOT v_enrolled THEN
    RAISE EXCEPTION 'Not enrolled' USING ERRCODE = 'P0001';
  END IF;

  -- Check existing active entry
  SELECT id INTO v_existing
  FROM program_queue_entries
  WHERE program_id = p_program_id
    AND student_id = auth.uid()
    AND status IN ('waiting', 'notified');
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'Already in queue' USING ERRCODE = 'P0001';
  END IF;

  -- Calculate position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM program_queue_entries
  WHERE program_id = p_program_id
    AND status = 'waiting';

  -- Insert entry
  INSERT INTO program_queue_entries (program_id, student_id, position, expires_at)
  VALUES (p_program_id, auth.uid(), v_position, now() + interval '2 hours')
  RETURNING * INTO v_entry;

  -- Estimate wait time (rolling avg of last 50 completed sessions, default 15 min)
  SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 60)::INTEGER,
    15
  ) INTO v_avg_duration
  FROM (
    SELECT updated_at, created_at
    FROM sessions
    WHERE program_id = p_program_id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 50
  ) s;

  RETURN jsonb_build_object(
    'entry_id', v_entry.id,
    'position', v_entry.position,
    'estimated_wait_minutes', v_position * v_avg_duration,
    'expires_at', v_entry.expires_at
  );
END;
$$;

-- =============================================================================
-- Section 14: RPC — leave_queue
-- =============================================================================

CREATE OR REPLACE FUNCTION leave_queue(
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
BEGIN
  SELECT id, position INTO v_entry
  FROM program_queue_entries
  WHERE program_id = p_program_id
    AND student_id = auth.uid()
    AND status IN ('waiting', 'notified');

  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'Not in queue' USING ERRCODE = 'P0001';
  END IF;

  -- Set to left
  UPDATE program_queue_entries SET status = 'left' WHERE id = v_entry.id;

  -- Compact positions
  UPDATE program_queue_entries
  SET position = position - 1
  WHERE program_id = p_program_id
    AND status = 'waiting'
    AND position > v_entry.position;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================================
-- Section 15: RPC — claim_queue_slot
-- =============================================================================

CREATE OR REPLACE FUNCTION claim_queue_slot(
  p_entry_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry program_queue_entries;
  v_teacher RECORD;
BEGIN
  SELECT * INTO v_entry FROM program_queue_entries WHERE id = p_entry_id;

  IF v_entry IS NULL THEN
    RAISE EXCEPTION 'Entry not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_entry.student_id != auth.uid() THEN
    RAISE EXCEPTION 'Not your entry' USING ERRCODE = 'P0001';
  END IF;

  IF v_entry.status = 'claimed' THEN
    RAISE EXCEPTION 'Already claimed' USING ERRCODE = 'P0001';
  END IF;

  IF v_entry.status = 'expired' OR v_entry.status = 'left' THEN
    RAISE EXCEPTION 'Entry expired' USING ERRCODE = 'P0001';
  END IF;

  IF v_entry.status != 'notified' THEN
    RAISE EXCEPTION 'Entry not found' USING ERRCODE = 'P0001';
  END IF;

  IF v_entry.claim_expires_at <= now() THEN
    RAISE EXCEPTION 'Claim window expired' USING ERRCODE = 'P0001';
  END IF;

  -- Claim it
  UPDATE program_queue_entries SET status = 'claimed' WHERE id = p_entry_id;

  -- Find an available teacher in this program
  SELECT
    ta.teacher_id,
    p.full_name AS teacher_name,
    p.meeting_link,
    p.meeting_platform
  INTO v_teacher
  FROM teacher_availability ta
  JOIN profiles p ON p.id = ta.teacher_id
  WHERE ta.program_id = v_entry.program_id
    AND ta.is_available = true
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'teacher_id', v_teacher.teacher_id,
    'teacher_name', v_teacher.teacher_name,
    'meeting_link', COALESCE(v_teacher.meeting_link, ''),
    'meeting_platform', COALESCE(v_teacher.meeting_platform, '')
  );
END;
$$;

-- =============================================================================
-- Section 16: RPC — get_queue_status
-- =============================================================================

CREATE OR REPLACE FUNCTION get_queue_status(
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_total INTEGER;
  v_avg_duration INTEGER;
BEGIN
  -- Total active in queue
  SELECT COUNT(*) INTO v_total
  FROM program_queue_entries
  WHERE program_id = p_program_id AND status IN ('waiting', 'notified');

  -- Student's own entry
  SELECT id, position, status, expires_at, claim_expires_at
  INTO v_entry
  FROM program_queue_entries
  WHERE program_id = p_program_id
    AND student_id = auth.uid()
    AND status IN ('waiting', 'notified');

  IF v_entry IS NULL THEN
    RETURN jsonb_build_object('in_queue', false, 'total_in_queue', v_total);
  END IF;

  -- Avg session duration for wait estimate
  SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) / 60)::INTEGER,
    15
  ) INTO v_avg_duration
  FROM (
    SELECT updated_at, created_at
    FROM sessions
    WHERE program_id = p_program_id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 50
  ) s;

  RETURN jsonb_build_object(
    'in_queue', true,
    'entry_id', v_entry.id,
    'position', v_entry.position,
    'total_in_queue', v_total,
    'estimated_wait_minutes', v_entry.position * v_avg_duration,
    'status', v_entry.status,
    'expires_at', v_entry.expires_at,
    'claim_expires_at', v_entry.claim_expires_at
  );
END;
$$;

-- =============================================================================
-- Section 17: RPC — get_program_demand
-- =============================================================================

CREATE OR REPLACE FUNCTION get_program_demand(
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_program_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM program_queue_entries
  WHERE program_id = p_program_id AND status IN ('waiting', 'notified');

  SELECT name INTO v_program_name FROM programs WHERE id = p_program_id;

  RETURN jsonb_build_object(
    'waiting_count', v_count,
    'program_id', p_program_id,
    'program_name', COALESCE(v_program_name, '')
  );
END;
$$;

-- =============================================================================
-- Section 18: RPC — get_daily_session_count
-- =============================================================================

CREATE OR REPLACE FUNCTION get_daily_session_count(
  p_program_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
  v_school_tz TEXT;
  v_today DATE;
BEGIN
  SELECT COALESCE(s.timezone, 'UTC') INTO v_school_tz FROM schools s LIMIT 1;
  v_today := (now() AT TIME ZONE v_school_tz)::DATE;

  SELECT COALESCE(session_count, 0) INTO v_count
  FROM daily_session_counts
  WHERE student_id = auth.uid()
    AND program_id = p_program_id
    AND session_date = v_today;

  IF v_count IS NULL THEN
    v_count := 0;
  END IF;

  SELECT COALESCE(daily_session_limit, 2) INTO v_limit
  FROM programs WHERE id = p_program_id;

  RETURN jsonb_build_object(
    'session_count', v_count,
    'daily_limit', v_limit,
    'has_reached_limit', v_count >= v_limit
  );
END;
$$;

-- =============================================================================
-- Section 19: Triggers
-- =============================================================================

-- Trigger: recalculate stats after rating change
CREATE OR REPLACE FUNCTION trigger_recalculate_teacher_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_teacher_stats(OLD.teacher_id, OLD.program_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_teacher_stats(NEW.teacher_id, NEW.program_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS after_rating_change ON teacher_ratings;
CREATE TRIGGER after_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON teacher_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_teacher_stats();

-- Trigger: increment daily session count on session completion
CREATE OR REPLACE FUNCTION trigger_after_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_category TEXT;
  v_school_tz TEXT;
  v_today DATE;
BEGIN
  -- Only on status change to completed
  IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Only for free programs
  IF NEW.program_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT category INTO v_program_category FROM programs WHERE id = NEW.program_id;
  IF v_program_category != 'free' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(s.timezone, 'UTC') INTO v_school_tz FROM schools s LIMIT 1;
  v_today := (now() AT TIME ZONE v_school_tz)::DATE;

  INSERT INTO daily_session_counts (student_id, program_id, session_date, session_count)
  VALUES (NEW.student_id, NEW.program_id, v_today, 1)
  ON CONFLICT (student_id, program_id, session_date)
  DO UPDATE SET session_count = daily_session_counts.session_count + 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_session_completed_daily_count ON sessions;
CREATE TRIGGER after_session_completed_daily_count
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_after_session_completed();

-- Trigger: process queue on teacher available
CREATE OR REPLACE FUNCTION trigger_on_teacher_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only when teacher goes available
  IF NEW.is_available = true AND (OLD IS NULL OR OLD.is_available = false) THEN
    -- Invoke queue-processor Edge Function via pg_net
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/queue-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'teacher_id', NEW.teacher_id,
        'program_id', NEW.program_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_teacher_available_queue ON teacher_availability;
CREATE TRIGGER on_teacher_available_queue
  AFTER UPDATE ON teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION trigger_on_teacher_available();

-- =============================================================================
-- Section 20: RLS Policies
-- =============================================================================

ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_rating_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_exclusion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_session_counts ENABLE ROW LEVEL SECURITY;

-- teacher_ratings policies
CREATE POLICY "Students can insert own ratings" ON teacher_ratings
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own ratings" ON teacher_ratings
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view ratings about them" ON teacher_ratings
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Supervisors can view ratings in their programs" ON teacher_ratings
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = teacher_ratings.program_id
      AND role IN ('supervisor', 'program_admin')
  ));

CREATE POLICY "Supervisors can update exclusion" ON teacher_ratings
  FOR UPDATE TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = teacher_ratings.program_id
      AND role = 'supervisor'
  ))
  WITH CHECK (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = teacher_ratings.program_id
      AND role = 'supervisor'
  ));

CREATE POLICY "Master admins can view all ratings" ON teacher_ratings
  FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'));

-- teacher_rating_stats policies
CREATE POLICY "Students can view stats with 5+ reviews" ON teacher_rating_stats
  FOR SELECT TO authenticated
  USING (total_reviews >= 5 OR teacher_id = auth.uid());

CREATE POLICY "Teachers can view own stats" ON teacher_rating_stats
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all stats" ON teacher_rating_stats
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = teacher_rating_stats.program_id
      AND role IN ('supervisor', 'program_admin')
  ) OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'));

-- rating_exclusion_log policies
CREATE POLICY "Supervisors can insert exclusion logs" ON rating_exclusion_log
  FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid());

CREATE POLICY "Supervisors can view exclusion logs" ON rating_exclusion_log
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM teacher_ratings tr
    JOIN program_roles pr ON pr.program_id = tr.program_id
    WHERE tr.id = rating_exclusion_log.rating_id
      AND pr.profile_id = auth.uid()
      AND pr.role IN ('supervisor', 'program_admin')
  ) OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'));

-- program_queue_entries policies
CREATE POLICY "Students can insert own queue entries" ON program_queue_entries
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own queue entries" ON program_queue_entries
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own queue entries" ON program_queue_entries
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view queue counts" ON program_queue_entries
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = program_queue_entries.program_id
      AND role = 'teacher'
  ));

CREATE POLICY "Admins can view all queue entries" ON program_queue_entries
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = program_queue_entries.program_id
      AND role IN ('supervisor', 'program_admin')
  ) OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'));

-- daily_session_counts policies
CREATE POLICY "Students can view own daily counts" ON daily_session_counts
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Staff can view daily counts" ON daily_session_counts
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM program_roles
    WHERE profile_id = auth.uid()
      AND program_id = daily_session_counts.program_id
  ) OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin'));

-- =============================================================================
-- Section 21: pg_cron Jobs
-- =============================================================================

-- Queue cascade processor: expire unclaimed notified entries, cascade to next
SELECT cron.schedule(
  'queue_cascade_processor',
  '* * * * *',
  $$
  -- Expire unclaimed notified entries
  UPDATE program_queue_entries
  SET status = 'expired'
  WHERE status = 'notified' AND claim_expires_at <= now();

  -- Cascade to next waiting student per program
  WITH expired_programs AS (
    SELECT DISTINCT program_id
    FROM program_queue_entries
    WHERE status = 'expired'
      AND claim_expires_at IS NOT NULL
      AND claim_expires_at > now() - interval '2 minutes'
  ),
  next_students AS (
    SELECT DISTINCT ON (pqe.program_id) pqe.id, pqe.program_id, pqe.student_id
    FROM program_queue_entries pqe
    JOIN expired_programs ep ON ep.program_id = pqe.program_id
    WHERE pqe.status = 'waiting'
    ORDER BY pqe.program_id, pqe.position
  )
  UPDATE program_queue_entries pqe
  SET status = 'notified',
      notified_at = now(),
      claim_expires_at = now() + interval '3 minutes'
  FROM next_students ns
  WHERE pqe.id = ns.id;
  $$
);

-- Queue auto-expiry: expire entries past 2h timeout
SELECT cron.schedule(
  'queue_auto_expiry',
  '*/5 * * * *',
  $$
  UPDATE program_queue_entries
  SET status = 'expired'
  WHERE status IN ('waiting', 'notified')
    AND expires_at <= now();
  $$
);

-- Teacher demand check: notify offline teachers when queue is large
SELECT cron.schedule(
  'teacher_demand_check',
  '*/5 * * * *',
  $$
  -- This job checks queue sizes and sends demand notifications
  -- The actual notification sending is handled via Edge Function invocation
  -- For MVP, the pg_cron job updates a flag and the Edge Function polls or is triggered
  DO $job$
  DECLARE
    v_program RECORD;
  BEGIN
    FOR v_program IN
      SELECT p.id AS program_id, p.queue_notification_threshold, COUNT(pqe.id) AS waiting_count
      FROM programs p
      JOIN program_queue_entries pqe ON pqe.program_id = p.id AND pqe.status IN ('waiting', 'notified')
      GROUP BY p.id, p.queue_notification_threshold
      HAVING COUNT(pqe.id) >= p.queue_notification_threshold
    LOOP
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'teacher_demand',
          'program_id', v_program.program_id,
          'waiting_count', v_program.waiting_count
        )
      );
    END LOOP;
  END;
  $job$;
  $$
);

-- Queue entry cleanup: purge old terminal entries daily
SELECT cron.schedule(
  'queue_entry_cleanup',
  '0 3 * * *',
  $$
  DELETE FROM program_queue_entries
  WHERE status IN ('claimed', 'expired', 'left')
    AND created_at < now() - interval '7 days';
  $$
);

-- =============================================================================
-- Section 22: Realtime Publication
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE teacher_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE teacher_rating_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE program_queue_entries;
