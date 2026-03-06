import { supabase } from '@/lib/supabase';
import type {
  JoinQueueResponse,
  QueueStatus,
  DailySessionCount,
  ProgramDemand,
  ClaimSlotResponse,
} from '../types/queue.types';

class QueueService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /** Get student's queue position and wait estimate */
  async getQueueStatus(programId: string) {
    const { data, error } = await supabase.rpc('get_queue_status' as any, {
      p_program_id: programId,
    });
    if (error) throw error;
    return data as QueueStatus;
  }

  /** Get demand count for a program (teacher view) */
  async getProgramDemand(programId: string) {
    const { data, error } = await supabase.rpc('get_program_demand' as any, {
      p_program_id: programId,
    });
    if (error) throw error;
    return data as ProgramDemand;
  }

  /** Get student's daily session count for a program */
  async getDailySessionCount(programId: string) {
    const { data, error } = await supabase.rpc('get_daily_session_count' as any, {
      p_program_id: programId,
    });
    if (error) throw error;
    return data as DailySessionCount;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  /** Join the queue for a free program */
  async joinQueue(programId: string) {
    const { data, error } = await supabase.rpc('join_queue' as any, {
      p_program_id: programId,
    });
    if (error) throw error;
    return data as JoinQueueResponse;
  }

  /** Leave the queue */
  async leaveQueue(programId: string) {
    const { data, error } = await supabase.rpc('leave_queue' as any, {
      p_program_id: programId,
    });
    if (error) throw error;
    return data as { success: boolean };
  }

  /** Claim a queue slot (after notification tap) */
  async claimQueueSlot(entryId: string) {
    const { data, error } = await supabase.rpc('claim_queue_slot' as any, {
      p_entry_id: entryId,
    });
    if (error) throw error;
    return data as ClaimSlotResponse;
  }
}

export const queueService = new QueueService();
