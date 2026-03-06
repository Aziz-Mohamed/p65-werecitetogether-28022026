import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import type { VoiceMemoMetadata, VoiceMemoUrl } from '../types/voice-memo.types';

class VoiceMemoService {
  /**
   * SE-005: Upload a voice memo file and create metadata record.
   * On metadata insert failure, cleans up the orphaned storage file.
   */
  async uploadMemo(sessionId: string, fileUri: string, durationSeconds: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Read the file
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      return { data: null, error: new Error('Recording file not found') };
    }

    const fileSize = (fileInfo as any).size ?? 0;
    const storagePath = `${sessionId}.m4a`;

    // Upload to Supabase Storage
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    const { error: uploadError } = await (supabase.storage as any)
      .from('voice-memos')
      .upload(storagePath, decode(fileContent), {
        contentType: 'audio/mp4',
        upsert: false,
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Create metadata record
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error: insertError } = await (supabase as any)
      .from('session_voice_memos')
      .insert({
        session_id: sessionId,
        teacher_id: user.id,
        storage_path: storagePath,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSize,
        expires_at: expiresAt,
      } as any)
      .select()
      .single();

    if (insertError) {
      // Clean up orphaned storage file
      await (supabase.storage as any).from('voice-memos').remove([storagePath]);
      return { data: null, error: insertError };
    }

    return { data, error: null };
  }

  /**
   * SE-006: Get a signed URL for voice memo playback.
   */
  async getMemoUrl(sessionId: string): Promise<{ data: VoiceMemoUrl | null; error: Error | null }> {
    const { data, error } = await (supabase.rpc as any)('get_voice_memo_url', {
      p_session_id: sessionId,
    });

    if (error) return { data: null, error };

    const result = data as any;
    if (!result) return { data: null, error: new Error('No voice memo found') };

    // If expired, return metadata without URL
    if (result.is_expired) {
      return {
        data: {
          url: null,
          duration_seconds: result.duration_seconds,
          created_at: result.created_at,
          is_expired: true,
        },
        error: null,
      };
    }

    // Generate signed URL from storage path
    const { data: signedUrlData, error: signError } = await (supabase.storage as any)
      .from('voice-memos')
      .createSignedUrl(result.storage_path, 3600); // 1 hour

    if (signError || !signedUrlData) {
      return { data: null, error: signError ?? new Error('Failed to generate signed URL') };
    }

    return {
      data: {
        url: signedUrlData.signedUrl,
        duration_seconds: result.duration_seconds,
        created_at: result.created_at,
        is_expired: false,
      },
      error: null,
    };
  }

  /**
   * SE-007: Get voice memo metadata (without URL).
   */
  async getMemoMetadata(sessionId: string): Promise<{ data: VoiceMemoMetadata | null; error: Error | null }> {
    const { data, error } = await (supabase as any)
      .from('session_voice_memos')
      .select('id, duration_seconds, file_size_bytes, is_expired, created_at, expires_at')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) return { data: null, error };
    return { data: data as VoiceMemoMetadata | null, error: null };
  }

  /**
   * Check if a voice memo can be attached to a session.
   * Session must be completed, < 24h old, and have no existing memo.
   */
  canAttachMemo(session: any): boolean {
    if (!session) return false;
    if (session.status === 'draft') return false;

    const createdAt = new Date(session.created_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - createdAt > twentyFourHours) return false;

    // Check if memo already exists (from joined data)
    const memos = session.session_voice_memos;
    if (Array.isArray(memos) && memos.length > 0) return false;

    return true;
  }
}

// Base64 decode helper for Supabase Storage upload
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const voiceMemoService = new VoiceMemoService();
