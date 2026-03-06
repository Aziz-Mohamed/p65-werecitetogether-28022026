-- ============================================================================
-- Migration: Session Logging Evolution
-- Feature: 005-session-evolution
-- Description: Adds program context, draft workflow, and voice memos to sessions
-- ============================================================================

-- ─── T004: Extend sessions table ────────────────────────────────────────────

-- Add nullable program_id FK (optional program context)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Add nullable status column (draft/completed, NULL = completed for backward compat)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'completed'));

-- Partial indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sessions_program_id
  ON sessions(program_id) WHERE program_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_status
  ON sessions(status) WHERE status = 'draft';

-- ─── T005: Create session_voice_memos table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS session_voice_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 120),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
  is_expired BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_voice_memos_expires_at
  ON session_voice_memos(expires_at) WHERE is_expired = false;

CREATE INDEX IF NOT EXISTS idx_session_voice_memos_teacher_id
  ON session_voice_memos(teacher_id);

-- ─── T006: Extend notification_preferences ──────────────────────────────────

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS voice_memo_received BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS draft_expired BOOLEAN DEFAULT true;

-- ─── T007: Voice memos storage bucket ───────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-memos',
  'voice-memos',
  false,
  512000,
  ARRAY['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: teacher upload (path must match a session they own)
CREATE POLICY "Teachers can upload voice memos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-memos'
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = REPLACE(name, '.m4a', '')::UUID
        AND sessions.teacher_id = auth.uid()
    )
  );

-- Storage policies: authenticated select (via signed URLs, RLS controls access)
CREATE POLICY "Authenticated users can read voice memos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'voice-memos');

-- Storage policies: teacher delete own memos
CREATE POLICY "Teachers can delete own voice memos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-memos'
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = REPLACE(name, '.m4a', '')::UUID
        AND sessions.teacher_id = auth.uid()
    )
  );

-- Storage policies: service role delete for cleanup
CREATE POLICY "Service role can delete voice memos" ON storage.objects
  FOR DELETE TO service_role
  USING (bucket_id = 'voice-memos');

-- ─── T008: RLS policies for sessions (draft visibility) ────────────────────

-- Enable RLS on sessions (should already be enabled)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Draft visibility: teachers see own drafts, others cannot see any drafts
-- Modify existing select policies to filter out drafts for non-owners
-- Since existing policies may vary, we add a specific draft filter policy

-- Teachers can see their own drafts
CREATE POLICY "Teachers can view own drafts" ON sessions
  FOR SELECT TO authenticated
  USING (
    status = 'draft' AND teacher_id = auth.uid()
  );

-- Teachers can update their own drafts
CREATE POLICY "Teachers can update own drafts" ON sessions
  FOR UPDATE TO authenticated
  USING (
    status = 'draft' AND teacher_id = auth.uid()
  )
  WITH CHECK (
    teacher_id = auth.uid()
  );

-- Teachers can delete their own drafts
CREATE POLICY "Teachers can delete own drafts" ON sessions
  FOR DELETE TO authenticated
  USING (
    status = 'draft' AND teacher_id = auth.uid()
  );

-- ─── T009: RLS policies for session_voice_memos ─────────────────────────────

ALTER TABLE session_voice_memos ENABLE ROW LEVEL SECURITY;

-- Teacher can select own memos
CREATE POLICY "Teachers can view own voice memos" ON session_voice_memos
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

-- Teacher can insert own memos for own sessions (within 24h)
CREATE POLICY "Teachers can insert voice memos" ON session_voice_memos
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
        AND sessions.teacher_id = auth.uid()
        AND sessions.status IS DISTINCT FROM 'draft'
        AND sessions.created_at > now() - interval '24 hours'
    )
  );

-- Student can view memos for own completed sessions
CREATE POLICY "Students can view session voice memos" ON session_voice_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
        AND sessions.student_id = auth.uid()
        AND sessions.status IS DISTINCT FROM 'draft'
    )
  );

-- Parent can view memos for children's sessions
CREATE POLICY "Parents can view children voice memos" ON session_voice_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN students ON students.id = sessions.student_id
      WHERE sessions.id = session_id
        AND students.parent_id = auth.uid()
        AND sessions.status IS DISTINCT FROM 'draft'
    )
  );

-- Supervisor/program_admin can view memos in assigned programs
CREATE POLICY "Supervisors can view program voice memos" ON session_voice_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN program_roles ON program_roles.program_id = sessions.program_id
      WHERE sessions.id = session_id
        AND program_roles.profile_id = auth.uid()
        AND program_roles.role IN ('supervisor', 'program_admin')
    )
  );

-- Master admin can view all memos
CREATE POLICY "Master admins can view all voice memos" ON session_voice_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'master_admin'
    )
  );

-- ─── T010: RPC function for signed URL generation ───────────────────────────

CREATE OR REPLACE FUNCTION get_voice_memo_url(p_session_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_memo RECORD;
  v_signed_url TEXT;
  v_can_access BOOLEAN := false;
  v_user_id UUID := auth.uid();
  v_user_role TEXT;
BEGIN
  -- Get memo metadata
  SELECT * INTO v_memo
  FROM session_voice_memos
  WHERE session_id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voice memo not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if memo is expired
  IF v_memo.is_expired THEN
    RETURN json_build_object(
      'url', NULL,
      'duration_seconds', v_memo.duration_seconds,
      'created_at', v_memo.created_at,
      'is_expired', true
    );
  END IF;

  -- Get user role
  SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;

  -- Check access: teacher owns it
  IF v_memo.teacher_id = v_user_id THEN
    v_can_access := true;
  END IF;

  -- Check access: student of the session
  IF NOT v_can_access THEN
    SELECT EXISTS (
      SELECT 1 FROM sessions
      WHERE id = p_session_id
        AND student_id = v_user_id
        AND status IS DISTINCT FROM 'draft'
    ) INTO v_can_access;
  END IF;

  -- Check access: parent of the student
  IF NOT v_can_access THEN
    SELECT EXISTS (
      SELECT 1 FROM sessions
      JOIN students ON students.id = sessions.student_id
      WHERE sessions.id = p_session_id
        AND students.parent_id = v_user_id
    ) INTO v_can_access;
  END IF;

  -- Check access: supervisor/program_admin
  IF NOT v_can_access THEN
    SELECT EXISTS (
      SELECT 1 FROM sessions
      JOIN program_roles ON program_roles.program_id = sessions.program_id
      WHERE sessions.id = p_session_id
        AND program_roles.profile_id = v_user_id
        AND program_roles.role IN ('supervisor', 'program_admin')
    ) INTO v_can_access;
  END IF;

  -- Check access: master_admin
  IF NOT v_can_access AND v_user_role = 'master_admin' THEN
    v_can_access := true;
  END IF;

  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = '42501';
  END IF;

  -- Generate signed URL (1 hour = 3600 seconds)
  SELECT (storage.foldername(v_memo.storage_path) || '/' || storage.filename(v_memo.storage_path)) INTO v_signed_url;

  RETURN json_build_object(
    'url', v_signed_url,
    'storage_path', v_memo.storage_path,
    'duration_seconds', v_memo.duration_seconds,
    'created_at', v_memo.created_at,
    'is_expired', false
  );
END;
$$;

-- ─── T011: pg_cron jobs & realtime ──────────────────────────────────────────

-- Enable realtime on session_voice_memos
ALTER PUBLICATION supabase_realtime ADD TABLE session_voice_memos;

-- Note: pg_cron jobs are created via Supabase Dashboard or direct SQL on the
-- hosted database. They cannot be part of migration files run via `supabase db push`.
-- The following are documented for manual setup:
--
-- SELECT cron.schedule(
--   'cleanup-expired-voice-memos',
--   '0 3 * * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-voice-memos',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
--     body := '{}'::jsonb
--   )$$
-- );
--
-- SELECT cron.schedule(
--   'cleanup-draft-sessions',
--   '30 3 * * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-drafts',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
--     body := '{}'::jsonb
--   )$$
-- );
