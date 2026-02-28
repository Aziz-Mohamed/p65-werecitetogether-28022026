import type { Tables } from '@/types/database.types';

export type VoiceMemo = Tables<'session_voice_memos'>;

export interface UploadVoiceMemoInput {
  sessionId: string;
  studentId: string;
  teacherId: string;
  programId: string;
  fileUri: string;
  durationSeconds: number;
  fileSizeBytes: number;
}
