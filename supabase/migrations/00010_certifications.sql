-- 00010_certifications.sql
-- Certification System (Ijazah) — table, sequence, indexes, RLS, triggers, 7 RPC functions

-- ─── Sequence ────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS certification_number_seq START 1;

-- ─── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id      uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  track_id        uuid        REFERENCES program_tracks(id) ON DELETE SET NULL,
  type            text        NOT NULL CHECK (type IN ('ijazah', 'graduation', 'completion')),
  status          text        NOT NULL DEFAULT 'recommended'
                              CHECK (status IN ('recommended', 'supervisor_approved', 'issued', 'returned', 'rejected', 'revoked')),
  title           text        NOT NULL,
  title_ar        text,
  notes           text,
  review_notes    text,
  chain_of_narration text     CHECK (length(chain_of_narration) <= 2000),
  certificate_number text     UNIQUE,
  issued_by       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  issue_date      timestamptz,
  revoked_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_at      timestamptz,
  revocation_reason text,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS certifications_active_unique
  ON certifications (student_id, program_id, COALESCE(track_id, '00000000-0000-0000-0000-000000000000'))
  WHERE status NOT IN ('rejected');

CREATE INDEX IF NOT EXISTS certifications_student_idx
  ON certifications (student_id);

CREATE INDEX IF NOT EXISTS certifications_program_status_idx
  ON certifications (program_id, status);

CREATE INDEX IF NOT EXISTS certifications_teacher_idx
  ON certifications (teacher_id);

CREATE UNIQUE INDEX IF NOT EXISTS certifications_certificate_number_idx
  ON certifications (certificate_number)
  WHERE certificate_number IS NOT NULL;

-- ─── Updated_at Trigger ──────────────────────────────────────────────────────
CREATE TRIGGER certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Students view own issued certs
CREATE POLICY certifications_student_select ON certifications
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    AND status = 'issued'
  );

-- Teachers view own recommendations (any status)
CREATE POLICY certifications_teacher_select ON certifications
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
  );

-- Teachers update returned certs (for resubmit — defense-in-depth, RPCs handle actual writes)
CREATE POLICY certifications_teacher_update ON certifications
  FOR UPDATE TO authenticated
  USING (
    teacher_id = auth.uid()
    AND status = 'returned'
  );

-- Supervisors view certs in their programs
CREATE POLICY certifications_supervisor_select ON certifications
  FOR SELECT TO authenticated
  USING (
    program_id IN (
      SELECT program_id FROM program_roles
      WHERE profile_id = auth.uid() AND role = 'supervisor'
    )
  );

-- Program admins view + update certs in their programs
CREATE POLICY certifications_program_admin_select ON certifications
  FOR SELECT TO authenticated
  USING (
    program_id IN (
      SELECT program_id FROM program_roles
      WHERE profile_id = auth.uid() AND role = 'program_admin'
    )
  );

CREATE POLICY certifications_program_admin_update ON certifications
  FOR UPDATE TO authenticated
  USING (
    program_id IN (
      SELECT program_id FROM program_roles
      WHERE profile_id = auth.uid() AND role = 'program_admin'
    )
  );

-- Master admins full access
CREATE POLICY certifications_master_admin_all ON certifications
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );

-- ─── RPC-001: recommend_certification ────────────────────────────────────────
CREATE OR REPLACE FUNCTION recommend_certification(
  p_student_id    uuid,
  p_program_id    uuid,
  p_track_id      uuid DEFAULT NULL,
  p_type          text DEFAULT 'completion',
  p_title         text DEFAULT '',
  p_title_ar      text DEFAULT NULL,
  p_notes         text DEFAULT NULL,
  p_metadata      jsonb DEFAULT '{}'
)
RETURNS SETOF certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  -- 1. Auth check
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'CERT_NOT_TEACHER: Not authenticated';
  END IF;

  -- 2. Caller must be teacher in this program
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = p_program_id
      AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'CERT_NOT_TEACHER: Caller is not a teacher in this program';
  END IF;

  -- 3. Student must have active enrollment (FR-015)
  IF NOT EXISTS (
    SELECT 1 FROM enrollments
    WHERE student_id = p_student_id
      AND program_id = p_program_id
      AND status IN ('active', 'approved')
  ) THEN
    RAISE EXCEPTION 'CERT_NOT_ENROLLED: Student is not actively enrolled in this program';
  END IF;

  -- 4. No duplicate active certification (FR-006)
  IF EXISTS (
    SELECT 1 FROM certifications
    WHERE student_id = p_student_id
      AND program_id = p_program_id
      AND COALESCE(track_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_track_id, '00000000-0000-0000-0000-000000000000')
      AND status NOT IN ('rejected')
  ) THEN
    RAISE EXCEPTION 'CERT_DUPLICATE: Active certification already exists for this student in this program/track';
  END IF;

  RETURN QUERY
  INSERT INTO certifications (student_id, teacher_id, program_id, track_id, type, title, title_ar, notes, metadata)
  VALUES (p_student_id, v_caller_id, p_program_id, p_track_id, p_type, p_title, p_title_ar, p_notes, p_metadata)
  RETURNING *;
END;
$$;

-- ─── RPC-002: review_certification ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION review_certification(
  p_certification_id  uuid,
  p_action            text,
  p_review_notes      text DEFAULT NULL
)
RETURNS SETOF certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_cert certifications%ROWTYPE;
BEGIN
  -- 1. Auth check
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'CERT_NOT_SUPERVISOR: Not authenticated';
  END IF;

  -- 2. Get certification and lock row
  SELECT * INTO v_cert FROM certifications WHERE id = p_certification_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CERT_NOT_FOUND: Certification does not exist';
  END IF;

  -- 3. Status check
  IF v_cert.status != 'recommended' THEN
    RAISE EXCEPTION 'CERT_INVALID_STATUS: Certification is not in recommended status';
  END IF;

  -- 4. Caller must be supervisor in this program
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_cert.program_id
      AND role = 'supervisor'
  ) THEN
    RAISE EXCEPTION 'CERT_NOT_SUPERVISOR: Caller is not a supervisor in this program';
  END IF;

  -- 5. Self-approval check (FR-018)
  IF v_caller_id = v_cert.teacher_id THEN
    RAISE EXCEPTION 'CERT_SELF_APPROVAL: Cannot review your own recommendation';
  END IF;

  IF p_action = 'approve' THEN
    RETURN QUERY
    UPDATE certifications
    SET status = 'supervisor_approved',
        reviewed_by = v_caller_id
    WHERE id = p_certification_id
    RETURNING *;

  ELSIF p_action = 'return' THEN
    -- Return notes required
    IF p_review_notes IS NULL OR trim(p_review_notes) = '' THEN
      RAISE EXCEPTION 'CERT_RETURN_NOTES_REQUIRED: Review notes required when returning';
    END IF;

    RETURN QUERY
    UPDATE certifications
    SET status = 'returned',
        review_notes = p_review_notes,
        reviewed_by = v_caller_id
    WHERE id = p_certification_id
    RETURNING *;

  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;
END;
$$;

-- ─── RPC-003: resubmit_certification ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION resubmit_certification(
  p_certification_id  uuid,
  p_notes             text DEFAULT NULL,
  p_title             text DEFAULT NULL,
  p_title_ar          text DEFAULT NULL
)
RETURNS SETOF certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_cert certifications%ROWTYPE;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'CERT_NOT_TEACHER: Not authenticated';
  END IF;

  SELECT * INTO v_cert FROM certifications WHERE id = p_certification_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CERT_NOT_FOUND: Certification does not exist';
  END IF;

  IF v_cert.status != 'returned' THEN
    RAISE EXCEPTION 'CERT_INVALID_STATUS: Certification is not in returned status';
  END IF;

  IF v_caller_id != v_cert.teacher_id THEN
    RAISE EXCEPTION 'CERT_NOT_TEACHER: Caller is not the recommending teacher';
  END IF;

  RETURN QUERY
  UPDATE certifications
  SET status = 'recommended',
      review_notes = NULL,
      notes = COALESCE(p_notes, notes),
      title = COALESCE(p_title, title),
      title_ar = COALESCE(p_title_ar, title_ar)
  WHERE id = p_certification_id
  RETURNING *;
END;
$$;

-- ─── RPC-004: issue_certification ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION issue_certification(
  p_certification_id      uuid,
  p_action                text,
  p_chain_of_narration    text DEFAULT NULL,
  p_review_notes          text DEFAULT NULL
)
RETURNS SETOF certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_cert certifications%ROWTYPE;
  v_cert_number text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'CERT_NOT_PROGRAM_ADMIN: Not authenticated';
  END IF;

  SELECT * INTO v_cert FROM certifications WHERE id = p_certification_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CERT_NOT_FOUND: Certification does not exist';
  END IF;

  IF v_cert.status != 'supervisor_approved' THEN
    RAISE EXCEPTION 'CERT_INVALID_STATUS: Certification is not in supervisor_approved status';
  END IF;

  -- Caller must be program admin in this program (FR-013)
  IF NOT EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_cert.program_id
      AND role = 'program_admin'
  ) THEN
    RAISE EXCEPTION 'CERT_NOT_PROGRAM_ADMIN: Caller is not a program admin in this program';
  END IF;

  -- Self-approval check (FR-018)
  IF v_caller_id = v_cert.teacher_id THEN
    RAISE EXCEPTION 'CERT_SELF_APPROVAL: Cannot issue a certification you recommended';
  END IF;

  IF p_action = 'issue' THEN
    -- Generate certificate number
    v_cert_number := 'WRT-' || extract(year FROM now())::text || '-' || lpad(nextval('certification_number_seq')::text, 5, '0');

    RETURN QUERY
    UPDATE certifications
    SET status = 'issued',
        certificate_number = v_cert_number,
        issued_by = v_caller_id,
        issue_date = now(),
        chain_of_narration = COALESCE(p_chain_of_narration, chain_of_narration)
    WHERE id = p_certification_id
    RETURNING *;

  ELSIF p_action = 'reject' THEN
    IF p_review_notes IS NULL OR trim(p_review_notes) = '' THEN
      RAISE EXCEPTION 'CERT_REJECT_NOTES_REQUIRED: Review notes required when rejecting';
    END IF;

    RETURN QUERY
    UPDATE certifications
    SET status = 'rejected',
        review_notes = p_review_notes
    WHERE id = p_certification_id
    RETURNING *;

  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;
END;
$$;

-- ─── RPC-005: revoke_certification ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION revoke_certification(
  p_certification_id      uuid,
  p_revocation_reason     text
)
RETURNS SETOF certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_cert certifications%ROWTYPE;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'CERT_NOT_AUTHORIZED: Not authenticated';
  END IF;

  IF p_revocation_reason IS NULL OR trim(p_revocation_reason) = '' THEN
    RAISE EXCEPTION 'CERT_REASON_REQUIRED: Revocation reason is required';
  END IF;

  SELECT * INTO v_cert FROM certifications WHERE id = p_certification_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CERT_NOT_FOUND: Certification does not exist';
  END IF;

  IF v_cert.status != 'issued' THEN
    RAISE EXCEPTION 'CERT_INVALID_STATUS: Only issued certificates can be revoked';
  END IF;

  -- Check authorization: master_admin (any program) or program_admin (own program)
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;

  IF v_caller_role = 'master_admin' THEN
    -- Master admin can revoke any
    NULL;
  ELSIF EXISTS (
    SELECT 1 FROM program_roles
    WHERE profile_id = v_caller_id
      AND program_id = v_cert.program_id
      AND role = 'program_admin'
  ) THEN
    -- Program admin can revoke in own program
    NULL;
  ELSE
    RAISE EXCEPTION 'CERT_NOT_AUTHORIZED: Caller lacks permission to revoke';
  END IF;

  RETURN QUERY
  UPDATE certifications
  SET status = 'revoked',
      revoked_by = v_caller_id,
      revoked_at = now(),
      revocation_reason = p_revocation_reason
  WHERE id = p_certification_id
  RETURNING *;
END;
$$;

-- ─── RPC-006: get_certification_pipeline ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_certification_pipeline(
  p_program_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_result json;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must be program admin or master admin
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_role != 'master_admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM program_roles
      WHERE profile_id = v_caller_id
        AND program_id = p_program_id
        AND role = 'program_admin'
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  SELECT json_build_object(
    'recommended', COALESCE(SUM(CASE WHEN status = 'recommended' THEN 1 ELSE 0 END), 0),
    'supervisor_approved', COALESCE(SUM(CASE WHEN status = 'supervisor_approved' THEN 1 ELSE 0 END), 0),
    'issued', COALESCE(SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END), 0),
    'returned', COALESCE(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0),
    'rejected', COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0),
    'revoked', COALESCE(SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END), 0),
    'total', COALESCE(COUNT(*), 0)
  ) INTO v_result
  FROM certifications
  WHERE program_id = p_program_id;

  RETURN v_result;
END;
$$;

-- ─── RPC-007: get_certification_queue ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_certification_queue(
  p_program_id uuid,
  p_role       text
)
RETURNS TABLE(
  id            uuid,
  student_name  text,
  student_avatar text,
  teacher_name  text,
  program_name  text,
  track_name    text,
  type          text,
  status        text,
  title         text,
  created_at    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_role = 'supervisor' THEN
    -- Supervisor sees 'recommended' certs where they supervise the teacher
    RETURN QUERY
    SELECT
      c.id,
      sp.full_name AS student_name,
      sp.avatar_url AS student_avatar,
      tp.full_name AS teacher_name,
      pr.name AS program_name,
      pt.name AS track_name,
      c.type,
      c.status,
      c.title,
      c.created_at
    FROM certifications c
    JOIN profiles sp ON sp.id = c.student_id
    JOIN profiles tp ON tp.id = c.teacher_id
    JOIN programs pr ON pr.id = c.program_id
    LEFT JOIN program_tracks pt ON pt.id = c.track_id
    WHERE c.program_id = p_program_id
      AND c.status = 'recommended'
      AND EXISTS (
        SELECT 1 FROM program_roles
        WHERE profile_id = v_caller_id
          AND program_id = p_program_id
          AND role = 'supervisor'
      )
    ORDER BY c.created_at ASC;

  ELSIF p_role = 'program_admin' THEN
    -- Program admin sees 'supervisor_approved' certs
    RETURN QUERY
    SELECT
      c.id,
      sp.full_name AS student_name,
      sp.avatar_url AS student_avatar,
      tp.full_name AS teacher_name,
      pr.name AS program_name,
      pt.name AS track_name,
      c.type,
      c.status,
      c.title,
      c.created_at
    FROM certifications c
    JOIN profiles sp ON sp.id = c.student_id
    JOIN profiles tp ON tp.id = c.teacher_id
    JOIN programs pr ON pr.id = c.program_id
    LEFT JOIN program_tracks pt ON pt.id = c.track_id
    WHERE c.program_id = p_program_id
      AND c.status = 'supervisor_approved'
      AND EXISTS (
        SELECT 1 FROM program_roles
        WHERE profile_id = v_caller_id
          AND program_id = p_program_id
          AND role = 'program_admin'
      )
    ORDER BY c.created_at ASC;

  ELSE
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
END;
$$;
