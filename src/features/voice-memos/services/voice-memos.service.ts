import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { VoiceMemo, UploadVoiceMemoInput } from '../types';

class VoiceMemosService {
  async uploadVoiceMemo(input: UploadVoiceMemoInput): Promise<ServiceResult<VoiceMemo>> {
    const storagePath = `voice-memos/${input.programId}/${input.sessionId}/${input.studentId}.m4a`;

    // Upload to Supabase Storage
    const response = await fetch(input.fileUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase
      .storage
      .from('voice-memos')
      .upload(storagePath, blob, {
        contentType: 'audio/mp4',
        upsert: true,
      });

    if (uploadError) {
      return { error: { message: uploadError.message } };
    }

    // Create DB record
    const { data, error } = await supabase
      .from('session_voice_memos')
      .insert({
        session_id: input.sessionId,
        student_id: input.studentId,
        teacher_id: input.teacherId,
        program_id: input.programId,
        storage_path: storagePath,
        duration_seconds: input.durationSeconds,
        file_size_bytes: input.fileSizeBytes,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getVoiceMemoForSession(
    sessionId: string,
    studentId: string,
  ): Promise<ServiceResult<VoiceMemo | null>> {
    const { data, error } = await supabase
      .from('session_voice_memos')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getVoiceMemoUrl(storagePath: string): Promise<ServiceResult<string>> {
    const { data } = await supabase
      .storage
      .from('voice-memos')
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (!data?.signedUrl) {
      return { error: { message: 'Failed to generate signed URL' } };
    }

    return { data: data.signedUrl };
  }
}

export const voiceMemosService = new VoiceMemosService();
