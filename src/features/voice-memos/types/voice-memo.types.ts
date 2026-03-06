export interface VoiceMemo {
  id: string;
  session_id: string;
  teacher_id: string;
  storage_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  is_expired: boolean;
  expires_at: string;
  created_at: string;
}

export interface UploadVoiceMemoInput {
  sessionId: string;
  fileUri: string;
  durationSeconds: number;
}

export interface VoiceMemoUrl {
  url: string | null;
  storage_path?: string;
  duration_seconds: number;
  created_at: string;
  is_expired: boolean;
}

export interface VoiceMemoMetadata {
  id: string;
  duration_seconds: number;
  file_size_bytes: number;
  is_expired: boolean;
  created_at: string;
  expires_at: string;
}

export interface UploadQueueItem {
  sessionId: string;
  fileUri: string;
  durationSeconds: number;
  addedAt: string;
}
