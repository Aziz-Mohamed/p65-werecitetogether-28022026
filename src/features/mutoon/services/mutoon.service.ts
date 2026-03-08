import { supabase } from '@/lib/supabase';
import type { UpdateMutoonProgressInput } from '../types/mutoon.types';

class MutoonService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /** Get student's mutoon progress for a program (with track names) */
  async getMyProgress(programId: string, userId: string) {
    return (supabase
      .from('mutoon_progress' as any)
      .select(`
        *,
        program_tracks ( id, name, name_ar )
      `)
      .eq('program_id', programId)
      .eq('student_id', userId)
      .order('created_at', { ascending: true })) as any;
  }

  /** Get a single progress entry */
  async getProgressEntry(progressId: string) {
    return (supabase
      .from('mutoon_progress' as any)
      .select('*')
      .eq('id', progressId)
      .single()) as any;
  }

  /** Get all student progress for a track (teacher view) */
  async getTrackProgress(trackId: string) {
    return (supabase
      .from('mutoon_progress' as any)
      .select(`
        *,
        profiles!mutoon_progress_student_id_fkey ( id, full_name )
      `)
      .eq('track_id', trackId)
      .order('current_line', { ascending: false })) as any;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  /** Initialize progress for a student on a track */
  async initProgress(studentId: string, programId: string, trackId: string, totalLines: number) {
    return (supabase
      .from('mutoon_progress' as any)
      .insert({
        student_id: studentId,
        program_id: programId,
        track_id: trackId,
        total_lines: totalLines,
        current_line: 0,
        status: 'in_progress',
      })
      .select()
      .single()) as any;
  }

  /** Update progress (advance line, add notes) */
  async updateProgress(progressId: string, input: UpdateMutoonProgressInput) {
    const updates: Record<string, unknown> = {
      current_line: input.currentLine,
      last_reviewed_at: new Date().toISOString(),
    };
    if (input.totalLines !== undefined) updates.total_lines = input.totalLines;
    if (input.notes !== undefined) updates.notes = input.notes;

    // Auto-complete if reached total lines
    if (input.totalLines && input.currentLine >= input.totalLines) {
      updates.status = 'completed';
    }

    return (supabase
      .from('mutoon_progress' as any)
      .update(updates)
      .eq('id', progressId)
      .select()
      .single()) as any;
  }

  /** Certify a completed mutoon (teacher action) */
  async certifyProgress(progressId: string, certifiedBy: string) {
    return (supabase
      .from('mutoon_progress' as any)
      .update({
        status: 'certified',
        certified_at: new Date().toISOString(),
        certified_by: certifiedBy,
      })
      .eq('id', progressId)
      .select()
      .single()) as any;
  }

  /** Increment review count */
  async recordReview(progressId: string) {
    // Read current, then increment — no RPC needed for simple increment
    const { data: current, error: readError } = await this.getProgressEntry(progressId);
    if (readError || !current) return { data: null, error: readError };

    return (supabase
      .from('mutoon_progress' as any)
      .update({
        review_count: (current as any).review_count + 1,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', progressId)
      .select()
      .single()) as any;
  }
}

export const mutoonService = new MutoonService();
