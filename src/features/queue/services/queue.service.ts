import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { QueueEntry, DailySessionCount } from '../types';

class QueueService {
  async joinQueue(
    studentId: string,
    programId: string,
  ): Promise<ServiceResult<QueueEntry>> {
    // Cancel any existing active queue entries for this student across ALL programs
    await supabase
      .from('free_program_queue')
      .update({ status: 'cancelled' })
      .eq('student_id', studentId)
      .in('status', ['waiting', 'notified']);

    // Calculate next position
    const { count, error: countError } = await supabase
      .from('free_program_queue')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('status', 'waiting');

    if (countError) {
      return { error: { message: countError.message, code: countError.code } };
    }

    const position = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from('free_program_queue')
      .insert({
        student_id: studentId,
        program_id: programId,
        position,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async leaveQueue(queueEntryId: string): Promise<ServiceResult<QueueEntry>> {
    const { data, error } = await supabase
      .from('free_program_queue')
      .update({ status: 'cancelled' })
      .eq('id', queueEntryId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getQueuePosition(
    studentId: string,
    programId: string,
  ): Promise<ServiceResult<QueueEntry | null>> {
    const { data, error } = await supabase
      .from('free_program_queue')
      .select('*')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('status', 'waiting')
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getQueueSize(programId: string): Promise<ServiceResult<number>> {
    const { count, error } = await supabase
      .from('free_program_queue')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('status', 'waiting');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: count ?? 0 };
  }

  async claimQueueSlot(queueEntryId: string): Promise<ServiceResult<QueueEntry>> {
    const { data, error } = await supabase
      .from('free_program_queue')
      .update({ status: 'claimed' })
      .eq('id', queueEntryId)
      .eq('status', 'notified')
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getDailySessionCount(
    studentId: string,
    programId: string,
  ): Promise<ServiceResult<number>> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_session_count')
      .select('session_count')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data?.session_count ?? 0 };
  }
}

export const queueService = new QueueService();
