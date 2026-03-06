-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 00012_gamification_ext.sql
-- Feature: 010-gamification-ext — Program-scoped stickers, leaderboard, badges
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Section 1: ALTER stickers — add nullable program_id ─────────────────────

ALTER TABLE stickers
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stickers_program_id
  ON stickers(program_id) WHERE program_id IS NOT NULL;

-- ─── Section 2: CREATE milestone_badges reference table ──────────────────────

CREATE TABLE IF NOT EXISTS milestone_badges (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT milestone_badges_category_check CHECK (category IN ('enrollment', 'sessions', 'streak'))
);

-- Seed 9 milestone badge types
INSERT INTO milestone_badges (id, category, threshold, name_en, name_ar, description_en, description_ar, icon, sort_order) VALUES
  ('enrollment_30d', 'enrollment', 30,  '30-Day Member',   'عضو ٣٠ يوماً',     'Enrolled for 30 days',              'مسجّل لمدة ٣٠ يوماً',            'calendar-outline',  1),
  ('enrollment_90d', 'enrollment', 90,  '90-Day Member',   'عضو ٩٠ يوماً',     'Enrolled for 90 days',              'مسجّل لمدة ٩٠ يوماً',            'calendar',          2),
  ('enrollment_1yr', 'enrollment', 365, 'One Year Member', 'عضو لسنة كاملة',   'Enrolled for one full year',        'مسجّل لمدة سنة كاملة',           'ribbon-outline',    3),
  ('sessions_10',    'sessions',   10,  '10 Sessions',     '١٠ جلسات',          'Completed 10 recitation sessions',  'أتمّ ١٠ جلسات تسميع',            'book-outline',      4),
  ('sessions_50',    'sessions',   50,  '50 Sessions',     '٥٠ جلسة',           'Completed 50 recitation sessions',  'أتمّ ٥٠ جلسة تسميع',             'book',              5),
  ('sessions_100',   'sessions',   100, '100 Sessions',    '١٠٠ جلسة',          'Completed 100 recitation sessions', 'أتمّ ١٠٠ جلسة تسميع',            'library-outline',   6),
  ('streak_7d',      'streak',     7,   '7-Day Streak',    'سلسلة ٧ أيام',      'Maintained a 7-day streak',         'حافظ على سلسلة ٧ أيام متتالية',  'flame-outline',     7),
  ('streak_30d',     'streak',     30,  '30-Day Streak',   'سلسلة ٣٠ يوماً',    'Maintained a 30-day streak',        'حافظ على سلسلة ٣٠ يوماً متتالياً', 'flame',           8),
  ('streak_100d',    'streak',     100, '100-Day Streak',  'سلسلة ١٠٠ يوم',     'Maintained a 100-day streak',       'حافظ على سلسلة ١٠٠ يوم متتالي', 'bonfire-outline',   9)
ON CONFLICT (id) DO NOTHING;

-- ─── Section 3: CREATE student_badges table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES milestone_badges(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_badges_unique UNIQUE (student_id, badge_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student_program
  ON student_badges(student_id, program_id);

-- ─── Section 4: RLS Policies ─────────────────────────────────────────────────

-- milestone_badges: read-only for all authenticated
ALTER TABLE milestone_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read milestone badges"
  ON milestone_badges FOR SELECT TO authenticated
  USING (true);

-- student_badges: students see own, supervisors/admins see program-scoped
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own badges"
  ON student_badges FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Program staff can read program badges"
  ON student_badges FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_roles
      WHERE program_roles.profile_id = auth.uid()
        AND program_roles.program_id = student_badges.program_id
        AND program_roles.role IN ('supervisor', 'program_admin', 'teacher')
    )
  );

CREATE POLICY "Admins can read all badges"
  ON student_badges FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'master_admin')
  );

-- student_badges: insert only via RPC (service_role), no direct client insert
CREATE POLICY "Service role can insert badges"
  ON student_badges FOR INSERT TO authenticated
  WITH CHECK (false);

-- stickers: update RLS for program-scoped visibility
-- Existing sticker policies use school_id scoping. Add program-aware SELECT.
CREATE POLICY "Users can read global and program stickers"
  ON stickers FOR SELECT TO authenticated
  USING (
    program_id IS NULL
    OR program_id IN (
      SELECT pr.program_id FROM program_roles pr WHERE pr.profile_id = auth.uid()
    )
    OR program_id IN (
      SELECT e.program_id FROM enrollments e
      WHERE e.student_id = auth.uid() AND e.status = 'active'
    )
  );

-- stickers: program admins can manage their program's stickers
CREATE POLICY "Program admins can insert program stickers"
  ON stickers FOR INSERT TO authenticated
  WITH CHECK (
    program_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM program_roles
      WHERE program_roles.profile_id = auth.uid()
        AND program_roles.program_id = stickers.program_id
        AND program_roles.role = 'program_admin'
    )
  );

CREATE POLICY "Program admins can update program stickers"
  ON stickers FOR UPDATE TO authenticated
  USING (
    program_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM program_roles
      WHERE program_roles.profile_id = auth.uid()
        AND program_roles.program_id = stickers.program_id
        AND program_roles.role = 'program_admin'
    )
  );

-- ─── Section 5: RPC — get_program_leaderboard ───────────────────────────────

CREATE OR REPLACE FUNCTION get_program_leaderboard(
  p_program_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_student_id UUID DEFAULT NULL
)
RETURNS TABLE(
  student_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  current_level INTEGER,
  longest_streak INTEGER,
  rank BIGINT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      s.id AS student_id,
      p.full_name,
      p.avatar_url,
      s.current_level,
      s.longest_streak,
      ROW_NUMBER() OVER (
        ORDER BY s.current_level DESC, s.longest_streak DESC, p.full_name ASC
      ) AS rank
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN profiles p ON p.id = s.id
    WHERE e.program_id = p_program_id
      AND e.status = 'active'
      AND s.is_active = true
  )
  SELECT r.student_id, r.full_name, r.avatar_url, r.current_level, r.longest_streak, r.rank
  FROM ranked r
  WHERE r.rank <= p_limit
  UNION ALL
  SELECT r.student_id, r.full_name, r.avatar_url, r.current_level, r.longest_streak, r.rank
  FROM ranked r
  WHERE r.student_id = p_student_id AND r.rank > p_limit
  ORDER BY rank;
END;
$$;

-- ─── Section 6: RPC — get_rewards_dashboard ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_rewards_dashboard(p_program_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'stickers_this_week', (
      SELECT count(*)::int FROM student_stickers ss
      JOIN stickers st ON st.id = ss.sticker_id
      WHERE (st.program_id = p_program_id OR st.program_id IS NULL)
        AND ss.awarded_at >= date_trunc('week', now())
    ),
    'stickers_this_month', (
      SELECT count(*)::int FROM student_stickers ss
      JOIN stickers st ON st.id = ss.sticker_id
      WHERE (st.program_id = p_program_id OR st.program_id IS NULL)
        AND ss.awarded_at >= date_trunc('month', now())
    ),
    'top_teachers', (
      SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
      FROM (
        SELECT ss.awarded_by AS teacher_id, p.full_name, count(*)::int AS award_count
        FROM student_stickers ss
        JOIN stickers st ON st.id = ss.sticker_id
        JOIN profiles p ON p.id = ss.awarded_by
        WHERE (st.program_id = p_program_id OR st.program_id IS NULL)
          AND ss.awarded_at >= date_trunc('month', now())
        GROUP BY ss.awarded_by, p.full_name
        ORDER BY award_count DESC
        LIMIT 5
      ) t
    ),
    'popular_stickers', (
      SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
      FROM (
        SELECT st.id AS sticker_id, st.name_en, st.name_ar, count(*)::int AS award_count
        FROM student_stickers ss
        JOIN stickers st ON st.id = ss.sticker_id
        WHERE (st.program_id = p_program_id OR st.program_id IS NULL)
        GROUP BY st.id, st.name_en, st.name_ar
        ORDER BY award_count DESC
        LIMIT 5
      ) s
    ),
    'badge_distribution', (
      SELECT COALESCE(jsonb_agg(b), '[]'::jsonb)
      FROM (
        SELECT mb.id AS badge_id, mb.name_en, mb.name_ar, count(sb.id)::int AS earned_count
        FROM milestone_badges mb
        LEFT JOIN student_badges sb ON sb.badge_id = mb.id AND sb.program_id = p_program_id
        GROUP BY mb.id, mb.name_en, mb.name_ar, mb.sort_order
        ORDER BY mb.sort_order
      ) b
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ─── Section 7: RPC — check_session_milestones ──────────────────────────────

CREATE OR REPLACE FUNCTION check_session_milestones(
  p_student_id UUID,
  p_program_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_count INTEGER;
  badge RECORD;
BEGIN
  -- Count completed sessions for student in program
  SELECT count(*)::int INTO session_count
  FROM sessions
  WHERE student_id = p_student_id
    AND program_id = p_program_id
    AND (status IS NULL OR status = 'completed');

  -- Check each session milestone
  FOR badge IN
    SELECT id, threshold FROM milestone_badges WHERE category = 'sessions'
  LOOP
    IF session_count >= badge.threshold THEN
      INSERT INTO student_badges (student_id, badge_id, program_id)
      VALUES (p_student_id, badge.id, p_program_id)
      ON CONFLICT (student_id, badge_id, program_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- ─── Section 8: RPC — check_streak_milestones ───────────────────────────────

CREATE OR REPLACE FUNCTION check_streak_milestones(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak_val INTEGER;
  enrollment RECORD;
  badge RECORD;
BEGIN
  SELECT current_streak INTO current_streak_val
  FROM students WHERE id = p_student_id;

  IF current_streak_val IS NULL THEN RETURN; END IF;

  -- For each active enrollment, check streak milestones
  FOR enrollment IN
    SELECT program_id FROM enrollments
    WHERE student_id = p_student_id AND status = 'active'
  LOOP
    FOR badge IN
      SELECT id, threshold FROM milestone_badges WHERE category = 'streak'
    LOOP
      IF current_streak_val >= badge.threshold THEN
        INSERT INTO student_badges (student_id, badge_id, program_id)
        VALUES (p_student_id, badge.id, enrollment.program_id)
        ON CONFLICT (student_id, badge_id, program_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- ─── Section 9: RPC — check_enrollment_duration_milestones ──────────────────

CREATE OR REPLACE FUNCTION check_enrollment_duration_milestones()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enrollment RECORD;
  badge RECORD;
  days_enrolled INTEGER;
BEGIN
  FOR enrollment IN
    SELECT e.student_id, e.program_id, e.enrolled_at
    FROM enrollments e
    JOIN programs prog ON prog.id = e.program_id AND prog.is_active = true
    WHERE e.status = 'active'
  LOOP
    days_enrolled := EXTRACT(EPOCH FROM (now() - enrollment.enrolled_at)) / 86400;

    FOR badge IN
      SELECT id, threshold FROM milestone_badges WHERE category = 'enrollment'
    LOOP
      IF days_enrolled >= badge.threshold THEN
        INSERT INTO student_badges (student_id, badge_id, program_id)
        VALUES (enrollment.student_id, badge.id, enrollment.program_id)
        ON CONFLICT (student_id, badge_id, program_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- ─── Section 10: Trigger — streak milestone check ───────────────────────────

CREATE OR REPLACE FUNCTION trigger_fn_check_streak_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_streak > OLD.current_streak THEN
    PERFORM check_streak_milestones(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_streak_milestones
  AFTER UPDATE OF current_streak ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fn_check_streak_milestones();

-- ─── Section 11: pg_cron — daily enrollment duration check ──────────────────

SELECT cron.schedule(
  'check-enrollment-duration-milestones',
  '0 4 * * *',
  $$SELECT check_enrollment_duration_milestones()$$
);
