import { supabase } from '@/lib/supabase';

class CheckinService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * TC-001: Check in the teacher.
   */
  async checkIn(teacherId: string, schoolId: string) {
    return supabase
      .from('teacher_checkins')
      .insert({
        teacher_id: teacherId,
        school_id: schoolId,
      })
      .select()
      .single();
  }

  /**
   * TC-002: Check out the teacher.
   */
  async checkOut(checkinId: string) {
    return supabase
      .from('teacher_checkins')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('id', checkinId)
      .select()
      .single();
  }

  /**
   * TC-003: Get today's check-in for a teacher.
   */
  async getTodayCheckin(teacherId: string) {
    const today = new Date().toISOString().split('T')[0];
    return supabase
      .from('teacher_checkins')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('date', today)
      .maybeSingle();
  }
}

export const checkinService = new CheckinService();
