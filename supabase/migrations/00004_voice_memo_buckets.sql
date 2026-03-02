-- =============================================================================
-- WeReciteTogether — Storage Buckets
-- =============================================================================

-- Voice memos bucket — private, 2MB max file size
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-memos',
  'voice-memos',
  false,
  2097152, -- 2MB
  ARRAY['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/x-m4a']
);

-- RLS: Teachers can upload voice memos
CREATE POLICY voice_memos_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'voice-memos'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('teacher', 'master_admin')
  );

-- RLS: Participants can read voice memos
CREATE POLICY voice_memos_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'voice-memos'
    AND (
      -- Teacher who recorded it
      EXISTS (
        SELECT 1 FROM session_voice_memos vm
        WHERE vm.storage_path = name AND vm.teacher_id = auth.uid()
      )
      -- Student it was recorded for
      OR EXISTS (
        SELECT 1 FROM session_voice_memos vm
        WHERE vm.storage_path = name AND vm.student_id = auth.uid()
      )
      -- Supervisor of the cohort
      OR EXISTS (
        SELECT 1 FROM session_voice_memos vm
        JOIN sessions s ON s.id = vm.session_id
        JOIN cohorts c ON c.id = s.cohort_id
        WHERE vm.storage_path = name AND c.supervisor_id = auth.uid()
      )
      -- Master admin
      OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
    )
  );

-- RLS: Only service role can delete (cleanup cron)
CREATE POLICY voice_memos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'voice-memos'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'
  );
