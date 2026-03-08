import { supabase } from '@/lib/supabase';
import type { ClassScheduleInput } from '../types/scheduling.types';

class ClassScheduleService {
  /**
   * Get all schedules for a class.
   */
  async getClassSchedules(classId: string) {
    return supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * Get all schedules for a school (admin view).
   */
  async getSchoolSchedules(schoolId: string) {
    return supabase
      .from('class_schedules')
      .select('*, class:classes!class_schedules_class_id_fkey(name)')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * Create or update a class schedule entry.
   */
  async upsertClassSchedule(input: ClassScheduleInput) {
    return supabase
      .from('class_schedules')
      .upsert(
        {
          class_id: input.classId,
          school_id: input.schoolId,
          day_of_week: input.dayOfWeek,
          start_time: input.startTime,
          end_time: input.endTime,
        },
        { onConflict: 'class_id,day_of_week,start_time' },
      )
      .select()
      .single();
  }

  /**
   * Delete a class schedule.
   */
  async deleteClassSchedule(id: string) {
    return supabase
      .from('class_schedules')
      .update({ is_active: false })
      .eq('id', id);
  }
}

export const classScheduleService = new ClassScheduleService();
