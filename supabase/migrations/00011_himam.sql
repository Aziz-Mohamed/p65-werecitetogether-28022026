-- =============================================================================
-- 00011_himam.sql
-- Himam Quranic Marathon Events — 3 tables, indexes, RLS, 8 RPC functions,
--   updated_at triggers, 5 pg_cron jobs
-- Date: 2026-03-06
-- =============================================================================

SET search_path = public;

-- =============================================================================
-- Section 1: Tables
-- =============================================================================

-- Table 1: himam_events — weekly marathon event
CREATE TABLE IF NOT EXISTS himam_events (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id            uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  event_date            date        NOT NULL,
  start_time            time        NOT NULL DEFAULT '05:00',
  end_time              time        NOT NULL DEFAULT '05:00',
  registration_deadline timestamptz NOT NULL,
  status                text        NOT NULL DEFAULT 'upcoming'
                                    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by            uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT himam_events_date_unique UNIQUE (event_date)
);

CREATE INDEX IF NOT EXISTS idx_himam_events_date ON himam_events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_himam_events_status ON himam_events (status) WHERE status = 'upcoming';

-- Table 2: himam_registrations — student signup per event
CREATE TABLE IF NOT EXISTS himam_registrations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES himam_events(id) ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track       text        NOT NULL CHECK (track IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')),
  selected_juz int[]      NOT NULL,
  partner_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  time_slots  jsonb       NOT NULL DEFAULT '[]',
  status      text        NOT NULL DEFAULT 'registered'
                          CHECK (status IN ('registered', 'paired', 'in_progress', 'completed', 'incomplete', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT himam_reg_event_student_unique UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_himam_reg_event_track ON himam_registrations (event_id, track);
CREATE INDEX IF NOT EXISTS idx_himam_reg_student ON himam_registrations (student_id);
CREATE INDEX IF NOT EXISTS idx_himam_reg_partner ON himam_registrations (partner_id) WHERE partner_id IS NOT NULL;

-- Table 3: himam_progress — per-juz completion tracking
CREATE TABLE IF NOT EXISTS himam_progress (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid        NOT NULL REFERENCES himam_registrations(id) ON DELETE CASCADE,
  juz_number      int         NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at    timestamptz,
  completed_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT himam_progress_reg_juz_unique UNIQUE (registration_id, juz_number)
);

CREATE INDEX IF NOT EXISTS idx_himam_progress_reg ON himam_progress (registration_id);

-- =============================================================================
-- Section 2: updated_at Triggers
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at ON himam_events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON himam_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON himam_registrations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON himam_registrations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- Section 3: RLS Policies — himam_events
-- =============================================================================

ALTER TABLE himam_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS himam_events_select ON himam_events;
CREATE POLICY himam_events_select ON himam_events FOR SELECT TO authenticated
USING (
  -- Enrolled students can view events for their program
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.student_id = auth.uid()
      AND enrollments.program_id = himam_events.program_id
      AND enrollments.status = 'active'
  )
  OR
  -- Supervisors / program_admins for this program
  EXISTS (
    SELECT 1 FROM program_roles
    WHERE program_roles.profile_id = auth.uid()
      AND program_roles.program_id = himam_events.program_id
      AND program_roles.role IN ('supervisor', 'program_admin')
  )
  OR
  -- Master admins
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

DROP POLICY IF EXISTS himam_events_insert ON himam_events;
CREATE POLICY himam_events_insert ON himam_events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM program_roles
    WHERE program_roles.profile_id = auth.uid()
      AND program_roles.program_id = himam_events.program_id
      AND program_roles.role IN ('supervisor', 'program_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

DROP POLICY IF EXISTS himam_events_update ON himam_events;
CREATE POLICY himam_events_update ON himam_events FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program_roles
    WHERE program_roles.profile_id = auth.uid()
      AND program_roles.program_id = himam_events.program_id
      AND program_roles.role IN ('supervisor', 'program_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

-- =============================================================================
-- Section 4: RLS Policies — himam_registrations
-- =============================================================================

ALTER TABLE himam_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS himam_reg_select ON himam_registrations;
CREATE POLICY himam_reg_select ON himam_registrations FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR partner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM himam_events he
    JOIN program_roles pr ON pr.program_id = he.program_id
    WHERE he.id = himam_registrations.event_id
      AND pr.profile_id = auth.uid()
      AND pr.role IN ('supervisor', 'program_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

DROP POLICY IF EXISTS himam_reg_insert ON himam_registrations;
CREATE POLICY himam_reg_insert ON himam_registrations FOR INSERT TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM himam_events he
    JOIN enrollments e ON e.program_id = he.program_id
    WHERE he.id = himam_registrations.event_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  )
);

DROP POLICY IF EXISTS himam_reg_update ON himam_registrations;
CREATE POLICY himam_reg_update ON himam_registrations FOR UPDATE TO authenticated
USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM himam_events he
    JOIN program_roles pr ON pr.program_id = he.program_id
    WHERE he.id = himam_registrations.event_id
      AND pr.profile_id = auth.uid()
      AND pr.role IN ('supervisor', 'program_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

-- =============================================================================
-- Section 5: RLS Policies — himam_progress
-- =============================================================================

ALTER TABLE himam_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS himam_progress_select ON himam_progress;
CREATE POLICY himam_progress_select ON himam_progress FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM himam_registrations hr
    WHERE hr.id = himam_progress.registration_id
      AND (hr.student_id = auth.uid() OR hr.partner_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM himam_registrations hr
    JOIN himam_events he ON he.id = hr.event_id
    JOIN program_roles pr ON pr.program_id = he.program_id
    WHERE hr.id = himam_progress.registration_id
      AND pr.profile_id = auth.uid()
      AND pr.role IN ('supervisor', 'program_admin')
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin')
);

DROP POLICY IF EXISTS himam_progress_insert ON himam_progress;
CREATE POLICY himam_progress_insert ON himam_progress FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM himam_registrations hr
    WHERE hr.id = himam_progress.registration_id
      AND (hr.student_id = auth.uid() OR hr.partner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS himam_progress_update ON himam_progress;
CREATE POLICY himam_progress_update ON himam_progress FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM himam_registrations hr
    WHERE hr.id = himam_progress.registration_id
      AND (hr.student_id = auth.uid() OR hr.partner_id = auth.uid())
  )
);

-- =============================================================================
-- Section 6: RPC — register_for_himam_event
-- =============================================================================

CREATE OR REPLACE FUNCTION register_for_himam_event(
  p_event_id uuid,
  p_track text,
  p_selected_juz int[],
  p_time_slots jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event himam_events%ROWTYPE;
  v_caller_id uuid := auth.uid();
  v_reg_id uuid;
  v_expected_count int;
  v_juz int;
  v_valid_slots text[] := ARRAY['fajr','dhuhr','asr','maghrib','isha','night'];
  v_slot text;
BEGIN
  -- Validate event exists and is upcoming
  SELECT * INTO v_event FROM himam_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_FOUND';
  END IF;
  IF v_event.status <> 'upcoming' THEN
    RAISE EXCEPTION 'HIMAM_REGISTRATION_CLOSED';
  END IF;
  IF now() >= v_event.registration_deadline THEN
    RAISE EXCEPTION 'HIMAM_REGISTRATION_CLOSED';
  END IF;

  -- Validate enrollment
  IF NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE student_id = v_caller_id
      AND program_id = v_event.program_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'HIMAM_NOT_ENROLLED';
  END IF;

  -- Validate track
  IF p_track NOT IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz') THEN
    RAISE EXCEPTION 'HIMAM_INVALID_TRACK';
  END IF;

  -- Get expected juz count for track
  v_expected_count := CASE p_track
    WHEN '3_juz' THEN 3
    WHEN '5_juz' THEN 5
    WHEN '10_juz' THEN 10
    WHEN '15_juz' THEN 15
    WHEN '30_juz' THEN 30
  END;

  -- Validate juz count
  IF array_length(p_selected_juz, 1) IS NULL OR array_length(p_selected_juz, 1) <> v_expected_count THEN
    RAISE EXCEPTION 'HIMAM_INVALID_JUZ_COUNT';
  END IF;

  -- Validate juz range and duplicates
  FOREACH v_juz IN ARRAY p_selected_juz LOOP
    IF v_juz < 1 OR v_juz > 30 THEN
      RAISE EXCEPTION 'HIMAM_INVALID_JUZ_RANGE';
    END IF;
  END LOOP;
  IF (SELECT COUNT(DISTINCT j) FROM unnest(p_selected_juz) j) <> v_expected_count THEN
    RAISE EXCEPTION 'HIMAM_INVALID_JUZ_RANGE';
  END IF;

  -- Validate time slots
  FOR v_slot IN SELECT jsonb_array_elements_text(p_time_slots) LOOP
    IF v_slot <> ALL(v_valid_slots) THEN
      RAISE EXCEPTION 'HIMAM_INVALID_JUZ_RANGE'; -- reuse error for invalid slots
    END IF;
  END LOOP;

  -- Insert registration (UNIQUE constraint handles duplicate check)
  BEGIN
    INSERT INTO himam_registrations (event_id, student_id, track, selected_juz, time_slots)
    VALUES (p_event_id, v_caller_id, p_track, p_selected_juz, p_time_slots)
    RETURNING id INTO v_reg_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'HIMAM_ALREADY_REGISTERED';
  END;

  -- Create progress rows for each selected juz
  INSERT INTO himam_progress (registration_id, juz_number)
  SELECT v_reg_id, j FROM unnest(p_selected_juz) j;

  RETURN jsonb_build_object(
    'registration_id', v_reg_id,
    'event_date', v_event.event_date,
    'track', p_track,
    'selected_juz', p_selected_juz,
    'time_slots', p_time_slots,
    'status', 'registered'
  );
END;
$$;

-- =============================================================================
-- Section 7: RPC — cancel_himam_registration
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_himam_registration(p_registration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg himam_registrations%ROWTYPE;
  v_event himam_events%ROWTYPE;
BEGIN
  SELECT * INTO v_reg FROM himam_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_REG_NOT_FOUND';
  END IF;
  IF v_reg.student_id <> auth.uid() THEN
    RAISE EXCEPTION 'HIMAM_REG_NOT_FOUND';
  END IF;
  IF v_reg.status <> 'registered' THEN
    RAISE EXCEPTION 'HIMAM_ALREADY_PAIRED';
  END IF;

  SELECT * INTO v_event FROM himam_events WHERE id = v_reg.event_id;
  IF now() >= v_event.registration_deadline THEN
    RAISE EXCEPTION 'HIMAM_DEADLINE_PASSED';
  END IF;

  -- Delete progress rows
  DELETE FROM himam_progress WHERE registration_id = p_registration_id;

  -- Set cancelled
  UPDATE himam_registrations SET status = 'cancelled' WHERE id = p_registration_id;
END;
$$;

-- =============================================================================
-- Section 8: RPC — mark_juz_complete
-- =============================================================================

CREATE OR REPLACE FUNCTION mark_juz_complete(p_registration_id uuid, p_juz_number int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg himam_registrations%ROWTYPE;
  v_event himam_events%ROWTYPE;
  v_partner_reg_id uuid;
  v_caller_id uuid := auth.uid();
  v_completed_count int;
  v_total_count int;
  v_all_complete boolean;
BEGIN
  -- Look up registration
  SELECT * INTO v_reg FROM himam_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_REG_NOT_FOUND';
  END IF;

  -- Validate caller is participant
  IF v_caller_id <> v_reg.student_id AND v_caller_id <> v_reg.partner_id THEN
    RAISE EXCEPTION 'HIMAM_NOT_PARTICIPANT';
  END IF;

  -- Validate event is active
  SELECT * INTO v_event FROM himam_events WHERE id = v_reg.event_id;
  IF v_event.status <> 'active' THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_ACTIVE';
  END IF;

  -- Validate registration is in_progress
  IF v_reg.status <> 'in_progress' THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_ACTIVE';
  END IF;

  -- Validate juz is in selection
  IF NOT (p_juz_number = ANY(v_reg.selected_juz)) THEN
    RAISE EXCEPTION 'HIMAM_JUZ_NOT_IN_SELECTION';
  END IF;

  -- Check if already completed (idempotent)
  IF EXISTS (
    SELECT 1 FROM himam_progress
    WHERE registration_id = p_registration_id AND juz_number = p_juz_number AND status = 'completed'
  ) THEN
    -- Return current stats (no error)
    SELECT COUNT(*) FILTER (WHERE status = 'completed'), COUNT(*)
    INTO v_completed_count, v_total_count
    FROM himam_progress WHERE registration_id = p_registration_id;

    RETURN jsonb_build_object(
      'completed_count', v_completed_count,
      'total_count', v_total_count,
      'all_complete', v_completed_count = v_total_count,
      'registration_status', v_reg.status
    );
  END IF;

  -- Update this registration's progress
  UPDATE himam_progress
  SET status = 'completed', completed_at = now(), completed_by = v_caller_id
  WHERE registration_id = p_registration_id AND juz_number = p_juz_number AND status = 'pending';

  -- Update partner's progress (if partner exists)
  IF v_reg.partner_id IS NOT NULL THEN
    -- Find partner's registration for the same event
    SELECT id INTO v_partner_reg_id
    FROM himam_registrations
    WHERE event_id = v_reg.event_id
      AND student_id = v_reg.partner_id
      AND status = 'in_progress';

    IF v_partner_reg_id IS NOT NULL THEN
      UPDATE himam_progress
      SET status = 'completed', completed_at = now(), completed_by = v_caller_id
      WHERE registration_id = v_partner_reg_id AND juz_number = p_juz_number AND status = 'pending';
    END IF;
  END IF;

  -- Count completed for this registration
  SELECT COUNT(*) FILTER (WHERE status = 'completed'), COUNT(*)
  INTO v_completed_count, v_total_count
  FROM himam_progress WHERE registration_id = p_registration_id;

  v_all_complete := v_completed_count = v_total_count;

  -- Auto-complete if all juz done
  IF v_all_complete THEN
    UPDATE himam_registrations SET status = 'completed' WHERE id = p_registration_id;
    IF v_partner_reg_id IS NOT NULL THEN
      -- Check if partner is also all complete
      IF NOT EXISTS (
        SELECT 1 FROM himam_progress
        WHERE registration_id = v_partner_reg_id AND status = 'pending'
      ) THEN
        UPDATE himam_registrations SET status = 'completed' WHERE id = v_partner_reg_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'completed_count', v_completed_count,
    'total_count', v_total_count,
    'all_complete', v_all_complete,
    'registration_status', CASE WHEN v_all_complete THEN 'completed' ELSE 'in_progress' END
  );
END;
$$;

-- =============================================================================
-- Section 9: RPC — generate_himam_pairings
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_himam_pairings(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event himam_events%ROWTYPE;
  v_caller_id uuid := auth.uid();
  v_track text;
  v_tracks text[] := ARRAY['3_juz','5_juz','10_juz','15_juz','30_juz'];
  v_regs uuid[];
  v_pairs_total int := 0;
  v_unpaired_total int := 0;
  v_track_stats jsonb := '{}'::jsonb;
  v_i int;
  v_reg_a uuid;
  v_reg_b uuid;
  v_student_a uuid;
  v_student_b uuid;
  v_track_pairs int;
  v_track_unpaired int;
BEGIN
  SELECT * INTO v_event FROM himam_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_FOUND';
  END IF;

  -- Auth check: supervisor/program_admin or service role
  IF v_caller_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_event.program_id
      AND role IN ('supervisor', 'program_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'HIMAM_UNAUTHORIZED';
  END IF;

  -- Process each track
  FOREACH v_track IN ARRAY v_tracks LOOP
    -- Get registrations sorted by time_slots for greedy matching
    SELECT array_agg(id ORDER BY jsonb_array_length(time_slots) DESC, created_at)
    INTO v_regs
    FROM himam_registrations
    WHERE event_id = p_event_id AND track = v_track AND status = 'registered';

    v_track_pairs := 0;
    v_track_unpaired := 0;

    IF v_regs IS NOT NULL AND array_length(v_regs, 1) > 0 THEN
      v_i := 1;
      WHILE v_i + 1 <= array_length(v_regs, 1) LOOP
        v_reg_a := v_regs[v_i];
        v_reg_b := v_regs[v_i + 1];

        -- Get student IDs
        SELECT student_id INTO v_student_a FROM himam_registrations WHERE id = v_reg_a;
        SELECT student_id INTO v_student_b FROM himam_registrations WHERE id = v_reg_b;

        -- Pair them
        UPDATE himam_registrations SET partner_id = v_student_b, status = 'paired' WHERE id = v_reg_a;
        UPDATE himam_registrations SET partner_id = v_student_a, status = 'paired' WHERE id = v_reg_b;

        v_track_pairs := v_track_pairs + 1;
        v_i := v_i + 2;
      END LOOP;

      -- Check for unpaired (odd count)
      IF v_i = array_length(v_regs, 1) THEN
        v_track_unpaired := 1;
      END IF;
    END IF;

    v_pairs_total := v_pairs_total + v_track_pairs;
    v_unpaired_total := v_unpaired_total + v_track_unpaired;
    v_track_stats := v_track_stats || jsonb_build_object(
      v_track, jsonb_build_object('pairs', v_track_pairs, 'unpaired', v_track_unpaired)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'pairs_created', v_pairs_total,
    'unpaired_students', v_unpaired_total,
    'tracks', v_track_stats
  );
END;
$$;

-- =============================================================================
-- Section 10: RPC — swap_himam_partners
-- =============================================================================

CREATE OR REPLACE FUNCTION swap_himam_partners(p_registration_id_a uuid, p_registration_id_b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg_a himam_registrations%ROWTYPE;
  v_reg_b himam_registrations%ROWTYPE;
  v_event himam_events%ROWTYPE;
  v_caller_id uuid := auth.uid();
  v_partner_a_old uuid;
  v_partner_b_old uuid;
BEGIN
  SELECT * INTO v_reg_a FROM himam_registrations WHERE id = p_registration_id_a;
  SELECT * INTO v_reg_b FROM himam_registrations WHERE id = p_registration_id_b;

  IF NOT FOUND OR v_reg_a.id IS NULL OR v_reg_b.id IS NULL THEN
    RAISE EXCEPTION 'HIMAM_REG_NOT_FOUND';
  END IF;

  IF v_reg_a.event_id <> v_reg_b.event_id THEN
    RAISE EXCEPTION 'HIMAM_DIFFERENT_EVENTS';
  END IF;

  SELECT * INTO v_event FROM himam_events WHERE id = v_reg_a.event_id;
  IF v_event.status <> 'upcoming' THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_UPCOMING';
  END IF;

  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_event.program_id
      AND role IN ('supervisor', 'program_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'HIMAM_UNAUTHORIZED';
  END IF;

  -- Store old partners
  v_partner_a_old := v_reg_a.partner_id;
  v_partner_b_old := v_reg_b.partner_id;

  -- If A was paired, update A's old partner to point to B's student
  IF v_partner_a_old IS NOT NULL THEN
    UPDATE himam_registrations
    SET partner_id = v_reg_b.student_id
    WHERE event_id = v_reg_a.event_id AND student_id = v_partner_a_old;
  END IF;

  -- If B was paired, update B's old partner to point to A's student
  IF v_partner_b_old IS NOT NULL THEN
    UPDATE himam_registrations
    SET partner_id = v_reg_a.student_id
    WHERE event_id = v_reg_b.event_id AND student_id = v_partner_b_old;
  END IF;

  -- Swap A and B's partners
  UPDATE himam_registrations SET partner_id = v_partner_b_old WHERE id = p_registration_id_a;
  UPDATE himam_registrations SET partner_id = v_partner_a_old WHERE id = p_registration_id_b;
END;
$$;

-- =============================================================================
-- Section 11: RPC — cancel_himam_event
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_himam_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event himam_events%ROWTYPE;
  v_caller_id uuid := auth.uid();
BEGIN
  SELECT * INTO v_event FROM himam_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_FOUND';
  END IF;
  IF v_event.status <> 'upcoming' THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_UPCOMING';
  END IF;

  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_event.program_id
      AND role IN ('supervisor', 'program_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'HIMAM_UNAUTHORIZED';
  END IF;

  -- Cancel event
  UPDATE himam_events SET status = 'cancelled' WHERE id = p_event_id;

  -- Cascade to all registrations
  UPDATE himam_registrations SET status = 'cancelled' WHERE event_id = p_event_id;
END;
$$;

-- =============================================================================
-- Section 12: RPC — get_himam_event_stats
-- =============================================================================

CREATE OR REPLACE FUNCTION get_himam_event_stats(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event himam_events%ROWTYPE;
  v_caller_id uuid := auth.uid();
  v_result jsonb;
  v_tracks jsonb := '{}'::jsonb;
  v_track_row RECORD;
BEGIN
  SELECT * INTO v_event FROM himam_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_FOUND';
  END IF;

  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_event.program_id
      AND role IN ('supervisor', 'program_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'HIMAM_UNAUTHORIZED';
  END IF;

  -- Per-track stats
  FOR v_track_row IN
    SELECT
      track,
      COUNT(*) AS registered,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status = 'incomplete') AS incomplete
    FROM himam_registrations
    WHERE event_id = p_event_id AND status <> 'cancelled'
    GROUP BY track
  LOOP
    v_tracks := v_tracks || jsonb_build_object(
      v_track_row.track, jsonb_build_object(
        'registered', v_track_row.registered,
        'completed', v_track_row.completed,
        'incomplete', v_track_row.incomplete
      )
    );
  END LOOP;

  -- Overall stats
  SELECT jsonb_build_object(
    'event_date', v_event.event_date,
    'total_registrations', COUNT(*),
    'total_paired', COUNT(*) FILTER (WHERE partner_id IS NOT NULL),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'incomplete', COUNT(*) FILTER (WHERE status = 'incomplete'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'tracks', v_tracks
  ) INTO v_result
  FROM himam_registrations
  WHERE event_id = p_event_id;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- Section 13: RPC — create_himam_event
-- =============================================================================

CREATE OR REPLACE FUNCTION create_himam_event(p_event_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_program_id uuid;
  v_deadline timestamptz;
  v_event_id uuid;
BEGIN
  -- Find Himam program
  SELECT id INTO v_program_id FROM programs WHERE name = 'Himam Quranic Marathon' LIMIT 1;
  IF v_program_id IS NULL THEN
    SELECT id INTO v_program_id FROM programs WHERE name_ar = 'برنامج همم القرآني' LIMIT 1;
  END IF;
  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'HIMAM_EVENT_NOT_FOUND'; -- program not found
  END IF;

  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_program_id
      AND role IN ('supervisor', 'program_admin')
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_caller_id AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'HIMAM_UNAUTHORIZED';
  END IF;

  -- Validate Saturday (DOW: 0=Sun, 1=Mon, ..., 6=Sat)
  IF EXTRACT(DOW FROM p_event_date) <> 6 THEN
    RAISE EXCEPTION 'HIMAM_INVALID_DATE';
  END IF;

  -- Calculate deadline: Friday 21:00 UTC = Saturday 00:00 Makkah
  v_deadline := (p_event_date - interval '1 day')::date + interval '21 hours';

  -- Insert (UNIQUE constraint handles duplicate)
  BEGIN
    INSERT INTO himam_events (program_id, event_date, registration_deadline, created_by)
    VALUES (v_program_id, p_event_date, v_deadline, v_caller_id)
    RETURNING id INTO v_event_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'HIMAM_EVENT_EXISTS';
  END;

  RETURN jsonb_build_object(
    'event_id', v_event_id,
    'event_date', p_event_date,
    'registration_deadline', v_deadline,
    'status', 'upcoming'
  );
END;
$$;

-- =============================================================================
-- Section 14: pg_cron — Event Activation (Saturday 02:00 UTC = 05:00 Makkah)
-- =============================================================================

SELECT cron.schedule(
  'himam_event_activation',
  '0 2 * * SAT',
  $$
  UPDATE himam_events
  SET status = 'active'
  WHERE status = 'upcoming'
    AND event_date = CURRENT_DATE;

  UPDATE himam_registrations
  SET status = 'in_progress'
  WHERE status = 'paired'
    AND event_id IN (
      SELECT id FROM himam_events WHERE status = 'active' AND event_date = CURRENT_DATE
    );
  $$
);

-- =============================================================================
-- Section 15: pg_cron — Event Closure (Sunday 02:00 UTC = 05:00 Makkah)
-- =============================================================================

SELECT cron.schedule(
  'himam_event_closure',
  '0 2 * * SUN',
  $$
  UPDATE himam_registrations
  SET status = 'incomplete'
  WHERE status = 'in_progress'
    AND event_id IN (
      SELECT id FROM himam_events WHERE status = 'active' AND event_date = CURRENT_DATE - interval '1 day'
    );

  UPDATE himam_events
  SET status = 'completed'
  WHERE status = 'active'
    AND event_date = CURRENT_DATE - interval '1 day';
  $$
);

-- =============================================================================
-- Section 16: pg_cron — Event Generation (Thursday 21:00 UTC = Friday 00:00 Makkah)
-- =============================================================================

SELECT cron.schedule(
  'himam_event_generation',
  '0 21 * * THU',
  $$
  DO $job$
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-himam-events',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  END $job$;
  $$
);

-- =============================================================================
-- Section 17: pg_cron — Registration Close + Pairing (Friday 21:00 UTC = Sat 00:00 Makkah)
-- =============================================================================

SELECT cron.schedule(
  'himam_pairing_trigger',
  '0 21 * * FRI',
  $$
  DO $job$
  DECLARE
    v_event_id uuid;
  BEGIN
    SELECT id INTO v_event_id FROM himam_events
    WHERE status = 'upcoming'
      AND event_date = CURRENT_DATE + interval '1 day'
    LIMIT 1;

    IF v_event_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-himam-pairings',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('event_id', v_event_id)
      );
    END IF;
  END $job$;
  $$
);

-- =============================================================================
-- Section 18: pg_cron — Reminder (Friday 14:00 UTC = 17:00 Makkah)
-- =============================================================================

SELECT cron.schedule(
  'himam_event_reminder',
  '0 14 * * FRI',
  $$
  DO $job$
  DECLARE
    v_reg RECORD;
  BEGIN
    FOR v_reg IN
      SELECT hr.student_id, he.event_date
      FROM himam_registrations hr
      JOIN himam_events he ON he.id = hr.event_id
      WHERE he.status = 'upcoming'
        AND he.event_date = CURRENT_DATE + interval '1 day'
        AND hr.status IN ('registered', 'paired')
    LOOP
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'himam_event_reminder',
          'student_id', v_reg.student_id,
          'event_date', v_reg.event_date
        )
      );
    END LOOP;
  END $job$;
  $$
);
