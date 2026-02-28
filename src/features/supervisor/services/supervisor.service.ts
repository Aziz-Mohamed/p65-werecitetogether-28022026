import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { TeacherSummary, FlaggedReview } from '../types';

class SupervisorService {
  async getAssignedTeachers(
    supervisorId: string,
    programId: string,
  ): Promise<ServiceResult<TeacherSummary[]>> {
    // Get teacher IDs assigned to this supervisor via program_roles
    const { data: roles, error: rolesError } = await supabase
      .from('program_roles')
      .select('profile_id')
      .eq('program_id', programId)
      .eq('role', 'teacher');

    if (rolesError) {
      return { error: { message: rolesError.message, code: rolesError.code } };
    }

    if (!roles || roles.length === 0) {
      return { data: [] };
    }

    const teacherIds = roles.map((r) => r.profile_id);

    // Get profiles for these teachers
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .in('id', teacherIds);

    if (profilesError) {
      return { error: { message: profilesError.message, code: profilesError.code } };
    }

    // Get rating stats for all teachers
    const { data: ratingStats } = await supabase
      .from('teacher_rating_stats')
      .select('teacher_id, average_rating, total_reviews')
      .eq('program_id', programId)
      .in('teacher_id', teacherIds);

    // Get flagged reviews (rating <= 2)
    const { data: flagged } = await supabase
      .from('teacher_reviews')
      .select('teacher_id')
      .eq('program_id', programId)
      .in('teacher_id', teacherIds)
      .lte('rating', 2)
      .eq('is_excluded', false);

    const flaggedTeacherIds = new Set(flagged?.map((f) => f.teacher_id) ?? []);
    const statsMap = new Map(
      (ratingStats ?? []).map((s) => [s.teacher_id, s]),
    );

    const summaries: TeacherSummary[] = (profiles ?? []).map((p) => {
      const stats = statsMap.get(p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        session_count_week: 0,
        session_count_month: 0,
        active_students: 0,
        average_rating: stats?.average_rating ?? null,
        total_reviews: stats?.total_reviews ?? 0,
        has_flagged_reviews: flaggedTeacherIds.has(p.id),
      };
    });

    return { data: summaries };
  }

  async getFlaggedReviews(
    programId: string,
  ): Promise<ServiceResult<FlaggedReview[]>> {
    const { data, error } = await supabase
      .from('teacher_reviews')
      .select(`
        id,
        teacher_id,
        student_id,
        rating,
        tags,
        comment,
        created_at,
        is_excluded,
        teacher:profiles!teacher_reviews_teacher_id_fkey(full_name),
        student:profiles!teacher_reviews_student_id_fkey(full_name)
      `)
      .eq('program_id', programId)
      .lte('rating', 2)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const reviews: FlaggedReview[] = (data ?? []).map((r: any) => ({
      id: r.id,
      teacher_id: r.teacher_id,
      teacher_name: r.teacher?.full_name ?? 'Unknown',
      student_id: r.student_id,
      student_name: r.student?.full_name ?? 'Unknown',
      rating: r.rating,
      tags: r.tags,
      comment: r.comment,
      created_at: r.created_at,
      is_excluded: r.is_excluded,
    }));

    return { data: reviews };
  }

  async reassignStudent(
    enrollmentId: string,
    newTeacherId: string,
  ): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('enrollments')
      .update({ teacher_id: newTeacherId })
      .eq('id', enrollmentId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  }
}

export const supervisorService = new SupervisorService();
