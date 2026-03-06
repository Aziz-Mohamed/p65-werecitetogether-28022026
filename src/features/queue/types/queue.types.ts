// ─── Enums & Literals ────────────────────────────────────────────────────────

export type QueueEntryStatus = 'waiting' | 'notified' | 'claimed' | 'expired' | 'left';

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface QueueEntry {
  id: string;
  program_id: string;
  student_id: string;
  position: number;
  status: QueueEntryStatus;
  notified_at: string | null;
  claim_expires_at: string | null;
  expires_at: string;
  created_at: string;
}

// ─── RPC Response Types ──────────────────────────────────────────────────────

export interface JoinQueueResponse {
  entry_id: string;
  position: number;
  estimated_wait_minutes: number;
  expires_at: string;
}

export interface QueueStatus {
  in_queue: boolean;
  entry_id?: string;
  position?: number;
  total_in_queue: number;
  estimated_wait_minutes?: number;
  status?: 'waiting' | 'notified';
  expires_at?: string;
  claim_expires_at?: string | null;
}

export interface DailySessionCount {
  session_count: number;
  daily_limit: number;
  has_reached_limit: boolean;
}

export interface ProgramDemand {
  waiting_count: number;
  program_id: string;
  program_name: string;
}

export interface ClaimSlotResponse {
  success: boolean;
  teacher_id: string;
  teacher_name: string;
  meeting_link: string;
  meeting_platform: string;
}
