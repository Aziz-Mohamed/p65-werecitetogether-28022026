import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { WaitlistEntry, Enrollment } from '../types';

class WaitlistService {
  async joinWaitlist(data: {
    studentId: string;
    programId: string;
    trackId?: string;
    cohortId?: string;
    teacherId?: string;
  }): Promise<ServiceResult<WaitlistEntry>> {
    // Get the next position in the waitlist
    const { count } = await supabase
      .from('program_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', data.programId)
      .eq('status', 'waiting');

    const nextPosition = (count ?? 0) + 1;

    const { data: entry, error } = await supabase
      .from('program_waitlist')
      .insert({
        student_id: data.studentId,
        program_id: data.programId,
        track_id: data.trackId ?? null,
        cohort_id: data.cohortId ?? null,
        teacher_id: data.teacherId ?? null,
        position: nextPosition,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: entry };
  }

  async leaveWaitlist(entryId: string): Promise<ServiceResult<void>> {
    const { error } = await supabase
      .from('program_waitlist')
      .delete()
      .eq('id', entryId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: undefined };
  }

  async confirmWaitlistOffer(entryId: string): Promise<ServiceResult<Enrollment>> {
    // Get the waitlist entry
    const { data: entry, error: fetchError } = await supabase
      .from('program_waitlist')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError || !entry) {
      return { error: { message: fetchError?.message ?? 'Waitlist entry not found', code: fetchError?.code } };
    }

    // Create enrollment and update waitlist status atomically
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: entry.student_id,
        program_id: entry.program_id,
        track_id: entry.track_id,
        cohort_id: entry.cohort_id,
        teacher_id: entry.teacher_id,
        status: 'approved',
      })
      .select()
      .single();

    if (enrollError) {
      return { error: { message: enrollError.message, code: enrollError.code } };
    }

    // Update waitlist status
    await supabase
      .from('program_waitlist')
      .update({ status: 'accepted' })
      .eq('id', entryId);

    return { data: enrollment };
  }

  async getWaitlistPosition(
    studentId: string,
    programId: string,
  ): Promise<ServiceResult<number | null>> {
    const { data, error } = await supabase
      .from('program_waitlist')
      .select('position')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('status', 'waiting')
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data?.position ?? null };
  }

  async getWaitlistByProgram(
    programId: string,
  ): Promise<ServiceResult<WaitlistEntry[]>> {
    const { data, error } = await supabase
      .from('program_waitlist')
      .select('*')
      .eq('program_id', programId)
      .eq('status', 'waiting')
      .order('position');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }
}

export const waitlistService = new WaitlistService();
