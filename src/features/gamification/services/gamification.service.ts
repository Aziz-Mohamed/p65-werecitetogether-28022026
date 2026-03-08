import { supabase } from '@/lib/supabase';

class GamificationService {
  /**
   * GS-001: Get sticker catalog, optionally filtered by program IDs.
   * When programIds provided: returns global stickers + stickers for those programs.
   * When omitted: returns only global stickers (backward-compatible).
   */
  async getStickers(programIds?: string[]) {
    let query = supabase
      .from('stickers')
      .select('*, programs(name, name_ar)')
      .eq('is_active', true)
      .order('tier')
      .order('name_en');

    if (programIds && programIds.length > 0) {
      query = query.or(`program_id.is.null,program_id.in.(${programIds.join(',')})`);
    } else {
      query = query.is('program_id', null);
    }

    return query;
  }

  /**
   * GS-002: Get all stickers awarded to a specific student.
   * Includes sticker details and the name of the person who awarded it.
   */
  async getStudentStickers(studentId: string) {
    return supabase
      .from('student_stickers')
      .select(
        '*, stickers(id, name_ar, name_en, tier, image_path), profiles!student_stickers_awarded_by_fkey(full_name, name_localized)',
      )
      .eq('student_id', studentId)
      .order('awarded_at', { ascending: false });
  }

  /**
   * GS-003: Award a sticker to a student.
   */
  async awardSticker(input: {
    studentId: string;
    stickerId: string;
    awardedBy: string;
    reason?: string;
  }) {
    return supabase
      .from('student_stickers')
      .insert({
        student_id: input.studentId,
        sticker_id: input.stickerId,
        awarded_by: input.awardedBy,
        reason: input.reason ?? null,
      })
      .select()
      .single();
  }

  /**
   * GS-003b: Mark stickers as seen (clear is_new flag).
   */
  async markStickersAsSeen(studentStickerId: string) {
    return supabase
      .from('student_stickers')
      .update({ is_new: false })
      .eq('id', studentStickerId);
  }

  /**
   * GS-003c: Mark all new stickers as seen for a student.
   */
  async markAllStickersAsSeen(studentId: string) {
    return supabase
      .from('student_stickers')
      .update({ is_new: false })
      .eq('student_id', studentId)
      .eq('is_new', true);
  }

  /**
   * GS-004: Get class leaderboard ranked by current_level (rubʿ-based).
   *
   * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
   */
  async getLeaderboard(classId: string) {
    return supabase
      .from('students')
      .select(
        '*, profiles!students_id_fkey!inner(full_name, name_localized, avatar_url)',
      )
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('current_level', { ascending: false })
      .limit(10);
  }

  /**
   * Get a single sticker by ID.
   */
  async getStickerById(id: string) {
    return supabase.from('stickers').select('*').eq('id', id).single();
  }

  /**
   * GS-008: Get all rubʿ certifications for a student (active + dormant).
   * Client computes freshness from last_reviewed_at, review_count, dormant_since.
   */
  async getRubCertifications(studentId: string) {
    return supabase
      .from('student_rub_certifications')
      .select('*, profiles!student_rub_certifications_certified_by_fkey(full_name, name_localized)')
      .eq('student_id', studentId)
      .order('rub_number');
  }

  /**
   * GS-009: Teacher certifies a new rubʿ for a student.
   */
  async certifyRub(input: { studentId: string; rubNumber: number; certifiedBy: string }) {
    return supabase
      .from('student_rub_certifications')
      .insert({
        student_id: input.studentId,
        rub_number: input.rubNumber,
        certified_by: input.certifiedBy,
      })
      .select()
      .single();
  }

  /**
   * GS-010: Undo a certification (grace period delete).
   */
  async undoCertification(certificationId: string) {
    return supabase
      .from('student_rub_certifications')
      .delete()
      .eq('id', certificationId);
  }

  /**
   * GS-011: Record a "Good" revision. Uses RPC for atomic review_count increment.
   * If resetReviewCount is true (30-90d dormancy recovery), resets count to 0.
   */
  async recordGoodRevision(certificationId: string, resetReviewCount: boolean) {
    if (resetReviewCount) {
      // 30-90 day dormancy recovery: reset review count + restore
      return supabase
        .from('student_rub_certifications')
        .update({
          last_reviewed_at: new Date().toISOString(),
          dormant_since: null,
          review_count: 0,
        })
        .eq('id', certificationId)
        .select()
        .single();
    }

    // Normal good revision: atomic increment via RPC
    return supabase.rpc('increment_review_count', { cert_id: certificationId });
  }

  /**
   * GS-012: Record a "Poor" revision. Sets last_reviewed_at to yield ~50% freshness.
   * Does NOT clear dormant_since (poor revision cannot restore dormancy).
   */
  async recordPoorRevision(certificationId: string, intervalDays: number) {
    const halfIntervalMs = (intervalDays / 2) * 24 * 60 * 60 * 1000;
    const adjustedTime = new Date(Date.now() - halfIntervalMs).toISOString();

    return supabase
      .from('student_rub_certifications')
      .update({ last_reviewed_at: adjustedTime })
      .eq('id', certificationId)
      .select()
      .single();
  }

  /**
   * GS-013: Re-certify a rubʿ dormant for 90+ days. Full reset.
   */
  async recertifyRub(certificationId: string, certifiedBy: string) {
    return supabase
      .from('student_rub_certifications')
      .update({
        certified_by: certifiedBy,
        certified_at: new Date().toISOString(),
        review_count: 0,
        last_reviewed_at: new Date().toISOString(),
        dormant_since: null,
      })
      .eq('id', certificationId)
      .select()
      .single();
  }

  /**
   * GS-014: Get the static 240-row Quran rubʿ reference data.
   */
  async getRubReference() {
    return supabase
      .from('quran_rub_reference')
      .select('*')
      .order('rub_number');
  }

  /**
   * GS-015: Batch update dormancy for certifications that have decayed to 0%.
   */
  async markDormant(certificationIds: string[]) {
    return supabase
      .from('student_rub_certifications')
      .update({ dormant_since: new Date().toISOString() })
      .in('id', certificationIds);
  }

  /**
   * GS-016: Update the cached current_level on the students table.
   */
  async updateStudentLevel(studentId: string, level: number) {
    return supabase
      .from('students')
      .update({ current_level: level })
      .eq('id', studentId);
  }

  /**
   * GS-017: Get all milestone badge types.
   */
  async getMilestoneBadges() {
    return supabase
      .from('milestone_badges' as never)
      .select('*')
      .order('sort_order');
  }

  /**
   * GS-018: Get a student's badges — all badge types with earned status.
   * LEFT JOINs milestone_badges with student_badges to show earned/locked.
   */
  async getStudentBadges(studentId: string, programId?: string) {
    let query = supabase
      .from('student_badges' as never)
      .select('*, milestone_badges(*)' as never)
      .eq('student_id', studentId);

    if (programId) {
      query = query.eq('program_id', programId);
    }

    return query.order('earned_at', { ascending: false });
  }

  /**
   * GS-019: Check and award session milestones after a session is saved.
   */
  async checkSessionMilestones(studentId: string, programId: string) {
    return supabase.rpc('check_session_milestones' as never, {
      p_student_id: studentId,
      p_program_id: programId,
    } as never);
  }

  /**
   * GS-020: Get rewards dashboard data for a program.
   */
  async getRewardsDashboard(programId: string) {
    return supabase.rpc('get_rewards_dashboard' as never, {
      p_program_id: programId,
    } as never);
  }
}

export const gamificationService = new GamificationService();
