import { supabase } from '@/lib/supabase';
import type { UpdateSectionInput, BatchUpdateItem, CurriculumSection } from '../types/curriculum-progress.types';

class CurriculumProgressService {
  /**
   * Get all progress rows for an enrollment, ordered by section number.
   */
  async getProgressByEnrollment(enrollmentId: string) {
    return supabase
      .from('curriculum_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('section_number', { ascending: true });
  }

  /**
   * Get aggregated progress summary for an enrollment.
   */
  async getProgressSummary(enrollmentId: string) {
    const { data, error } = await supabase
      .from('curriculum_progress')
      .select('status')
      .eq('enrollment_id', enrollmentId);

    if (error) return { data: null, error };

    const total = data?.length ?? 0;
    const completed = (data ?? []).filter(
      (r) => r.status === 'memorized' || r.status === 'certified' || r.status === 'passed',
    ).length;

    return {
      data: {
        total_sections: total,
        completed_sections: completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      error: null,
    };
  }

  /**
   * Get curriculum sections from track metadata (JSONB).
   */
  async getCurriculumSections(trackId: string) {
    const { data, error } = await supabase
      .from('program_tracks')
      .select('curriculum')
      .eq('id', trackId)
      .single();

    if (error) return { data: null, error };

    return {
      data: (data?.curriculum as CurriculumSection[] | null) ?? [],
      error: null,
    };
  }

  /**
   * Check certification eligibility via RPC.
   */
  async checkCertificationEligibility(enrollmentId: string) {
    return supabase.rpc('get_certification_eligibility', {
      p_enrollment_id: enrollmentId,
    });
  }

  /**
   * Initialize progress rows for a new enrollment from track curriculum metadata.
   */
  async initializeProgress(
    enrollmentId: string,
    trackId: string,
    progressType: string,
    studentId: string,
    programId: string,
  ) {
    const { data: sections, error: sectionsError } = await this.getCurriculumSections(trackId);
    if (sectionsError || !sections || sections.length === 0) {
      return { data: null, error: sectionsError ?? new Error('No curriculum sections found') };
    }

    const rows = (sections as CurriculumSection[]).map((section) => ({
      enrollment_id: enrollmentId,
      student_id: studentId,
      program_id: programId,
      progress_type: progressType,
      section_number: section.section_number,
      section_title: section.title,
      status: 'not_started',
    }));

    return supabase
      .from('curriculum_progress')
      .insert(rows)
      .select();
  }

  /**
   * Update a single section's progress.
   */
  async updateSectionProgress(progressId: string, input: UpdateSectionInput) {
    return supabase
      .from('curriculum_progress')
      .update({
        status: input.status,
        score: input.score ?? null,
        teacher_notes: input.teacher_notes ?? null,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', progressId)
      .select()
      .single();
  }

  /**
   * Batch-update multiple sections in one call.
   */
  async batchUpdateSections(updates: BatchUpdateItem[]) {
    const results = await Promise.all(
      updates.map((update) =>
        supabase
          .from('curriculum_progress')
          .update({
            status: update.status,
            score: update.score ?? null,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', update.progressId)
          .select()
          .single(),
      ),
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      return { data: null, error: errors[0].error };
    }

    return { data: results.map((r) => r.data), error: null };
  }
}

export const curriculumProgressService = new CurriculumProgressService();
