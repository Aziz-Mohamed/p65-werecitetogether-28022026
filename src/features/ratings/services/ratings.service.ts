import { supabase } from '@/lib/supabase';
import type {
  SubmitRatingInput,
  ExcludeRatingInput,
  RestoreRatingInput,
  Rating,
  RatingStats,
  TeacherReviewsResponse,
} from '../types/ratings.types';

class RatingsService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /** Check if a session has been rated by the current user */
  async getRatingForSession(sessionId: string) {
    return (supabase
      .from('teacher_ratings' as any)
      .select('id, star_rating, tags, comment, is_flagged, created_at')
      .eq('session_id', sessionId)
      .eq('student_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .maybeSingle()) as any;
  }

  /** Get aggregate stats for a teacher in a program */
  async getTeacherRatingStats(teacherId: string, programId: string) {
    const { data, error } = await supabase.rpc('get_teacher_rating_stats' as any, {
      p_teacher_id: teacherId,
      p_program_id: programId,
    });
    if (error) throw error;
    return data as RatingStats | null;
  }

  /** Get individual reviews (supervisor/admin only) */
  async getTeacherReviews(teacherId: string, programId: string, page = 1, pageSize = 20) {
    const { data, error } = await supabase.rpc('get_teacher_reviews' as any, {
      p_teacher_id: teacherId,
      p_program_id: programId,
      p_page: page,
      p_page_size: pageSize,
    });
    if (error) throw error;
    return data as TeacherReviewsResponse;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  /** Submit a rating for a completed session */
  async submitRating(input: SubmitRatingInput) {
    const { data, error } = await supabase.rpc('submit_rating' as any, {
      p_session_id: input.sessionId,
      p_star_rating: input.starRating,
      p_tags: input.tags,
      p_comment: input.comment,
    });
    if (error) throw error;
    return data as Rating;
  }

  /** Exclude a rating (supervisor only) */
  async excludeRating(input: ExcludeRatingInput) {
    const { data, error } = await supabase.rpc('exclude_rating' as any, {
      p_rating_id: input.ratingId,
      p_reason: input.reason,
    });
    if (error) throw error;
    return data as { success: boolean; rating_id: string; is_excluded: boolean };
  }

  /** Restore an excluded rating (supervisor only) */
  async restoreRating(input: RestoreRatingInput) {
    const { data, error } = await supabase.rpc('restore_rating' as any, {
      p_rating_id: input.ratingId,
      p_reason: input.reason,
    });
    if (error) throw error;
    return data as { success: boolean; rating_id: string; is_excluded: boolean };
  }
}

export const ratingsService = new RatingsService();
