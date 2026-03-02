-- =============================================================================
-- WeReciteTogether — Session Join Flow Migration
-- =============================================================================
-- Updates sessions status CHECK constraint to include 'expired' and
-- 'in_progress' statuses. Creates expire_draft_sessions() database function
-- for scheduled draft session auto-expiry.
-- =============================================================================

-- =============================================================================
-- Section 1: ALTER sessions status constraint
-- =============================================================================

-- Drop the existing constraint and recreate with new statuses
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled', 'expired'));

-- =============================================================================
-- Section 2: Functions
-- =============================================================================

-- Function to expire stale draft sessions based on per-program configurable TTL.
-- Designed to be called on a schedule (every 15 minutes) via cron or edge function.
-- Only expires sessions with status = 'draft'; sessions already transitioned to
-- 'in_progress' are NOT expired. Decrements teacher_availability.current_session_count.
CREATE OR REPLACE FUNCTION expire_draft_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_session RECORD;
BEGIN
  FOR expired_session IN
    SELECT s.id, s.teacher_id, s.program_id
    FROM sessions s
    JOIN programs p ON p.id = s.program_id
    WHERE s.status = 'draft'
      AND s.created_at < now() - make_interval(
        hours := COALESCE((p.settings->>'draft_session_ttl_hours')::int, 4)
      )
  LOOP
    -- Expire the session
    UPDATE sessions SET status = 'expired', updated_at = now()
    WHERE id = expired_session.id;

    -- Decrement teacher's current session count
    UPDATE teacher_availability
    SET current_session_count = GREATEST(0, current_session_count - 1),
        updated_at = now()
    WHERE teacher_id = expired_session.teacher_id
      AND program_id = expired_session.program_id;
  END LOOP;
END;
$$;

-- Atomically increment daily_session_count to avoid read-then-write race conditions.
CREATE OR REPLACE FUNCTION increment_daily_session_count(
  p_student_id UUID,
  p_program_id UUID,
  p_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_session_count (student_id, program_id, date, session_count)
  VALUES (p_student_id, p_program_id, p_date, 1)
  ON CONFLICT (student_id, program_id, date)
  DO UPDATE SET session_count = daily_session_count.session_count + 1,
               updated_at = now();
END;
$$;
