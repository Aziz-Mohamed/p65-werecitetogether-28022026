import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { TeacherAvailability, AvailableTeacher } from '../types';

class TeacherAvailabilityService {
  async toggleAvailability(
    programId: string,
    isAvailable: boolean,
  ): Promise<ServiceResult<TeacherAvailability>> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    const { data, error } = await supabase
      .from('teacher_availability')
      .upsert(
        {
          teacher_id: user.id,
          program_id: programId,
          is_available: isAvailable,
          current_session_count: isAvailable ? 0 : 0,
        },
        { onConflict: 'teacher_id,program_id' },
      )
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getAvailableTeachers(
    programId: string,
  ): Promise<ServiceResult<AvailableTeacher[]>> {
    const { data, error } = await supabase
      .from('teacher_availability')
      .select(
        `
        *,
        profiles!teacher_id (
          id,
          full_name,
          display_name,
          avatar_url,
          meeting_link,
          meeting_platform,
          languages
        ),
        teacher_rating_stats!teacher_id (
          average_rating,
          total_reviews
        )
      `,
      )
      .eq('program_id', programId)
      .eq('is_available', true);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const teachers: AvailableTeacher[] = (data ?? []).map((row: any) => ({
      id: row.teacher_id,
      profile: row.profiles,
      availability: {
        id: row.id,
        teacher_id: row.teacher_id,
        program_id: row.program_id,
        is_available: row.is_available,
        available_since: row.available_since,
        max_concurrent_students: row.max_concurrent_students,
        current_session_count: row.current_session_count,
        updated_at: row.updated_at,
      } as TeacherAvailability,
      ratingStats: row.teacher_rating_stats?.[0] ?? null,
    }));

    return { data: teachers };
  }

  async updateMaxConcurrent(
    programId: string,
    maxConcurrent: number,
  ): Promise<ServiceResult<TeacherAvailability>> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    const { data, error } = await supabase
      .from('teacher_availability')
      .update({ max_concurrent_students: maxConcurrent })
      .eq('teacher_id', user.id)
      .eq('program_id', programId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }
}

export const teacherAvailabilityService = new TeacherAvailabilityService();
