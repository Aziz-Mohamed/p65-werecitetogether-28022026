import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { TeacherReview, TeacherRatingStats, SubmitReviewInput } from '../types';

class TeacherRatingsService {
  async submitReview(input: SubmitReviewInput): Promise<ServiceResult<TeacherReview>> {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .insert({
        session_id: input.sessionId,
        teacher_id: input.teacherId,
        student_id: input.studentId,
        program_id: input.programId,
        rating: input.rating,
        tags: input.tags ?? null,
        comment: input.comment ?? null,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getReviewsForTeacher(
    teacherId: string,
    programId: string,
  ): Promise<ServiceResult<TeacherReview[]>> {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('program_id', programId)
      .eq('is_excluded', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getRatingStats(
    teacherId: string,
    programId: string,
  ): Promise<ServiceResult<TeacherRatingStats | null>> {
    const { data, error } = await supabase
      .from('teacher_rating_stats')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('program_id', programId)
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async excludeReview(
    reviewId: string,
    excludedBy: string,
    reason: string,
  ): Promise<ServiceResult<TeacherReview>> {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .update({
        is_excluded: true,
        excluded_by: excludedBy,
        exclusion_reason: reason,
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async canStudentReview(
    studentId: string,
    sessionId: string,
  ): Promise<ServiceResult<boolean>> {
    // Check if a review already exists for this student + session
    const { count, error } = await supabase
      .from('teacher_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('session_id', sessionId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: (count ?? 0) === 0 };
  }
}

export const teacherRatingsService = new TeacherRatingsService();
