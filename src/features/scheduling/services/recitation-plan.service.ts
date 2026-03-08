import { supabase } from '@/lib/supabase';
import type { CreateRecitationPlanInput, UpdateRecitationPlanInput } from '../types/recitation-plan.types';

const PLAN_SELECT = `
  *,
  setter:profiles!session_recitation_plans_set_by_fkey(full_name),
  student:students!session_recitation_plans_student_id_fkey(
    profiles!students_id_fkey(full_name)
  )
`;

class RecitationPlanService {
  /**
   * Get all recitation plans for a scheduled session.
   */
  async getPlansForSession(sessionId: string) {
    return supabase
      .from('session_recitation_plans')
      .select(PLAN_SELECT)
      .eq('scheduled_session_id', sessionId)
      .order('created_at', { ascending: true });
  }

  /**
   * Get the session-level default plan (student_id IS NULL).
   */
  async getSessionDefault(sessionId: string) {
    return supabase
      .from('session_recitation_plans')
      .select(PLAN_SELECT)
      .eq('scheduled_session_id', sessionId)
      .is('student_id', null)
      .maybeSingle();
  }

  /**
   * Get a specific student's plan for a session.
   */
  async getStudentPlan(sessionId: string, studentId: string) {
    return supabase
      .from('session_recitation_plans')
      .select(PLAN_SELECT)
      .eq('scheduled_session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle();
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * Upsert a teacher/admin plan. Uses select-then-insert/update
   * to work with partial unique index (source != 'student_suggestion').
   */
  async upsertPlan(input: CreateRecitationPlanInput) {
    const planData = {
      school_id: input.school_id,
      scheduled_session_id: input.scheduled_session_id,
      student_id: input.student_id ?? null,
      set_by: input.set_by,
      selection_mode: input.selection_mode,
      start_surah: input.start_surah,
      start_ayah: input.start_ayah,
      end_surah: input.end_surah,
      end_ayah: input.end_ayah,
      rub_number: input.rub_number ?? null,
      juz_number: input.juz_number ?? null,
      hizb_number: input.hizb_number ?? null,
      recitation_type: input.recitation_type,
      source: input.source ?? 'manual',
      assignment_id: input.assignment_id ?? null,
      notes: input.notes ?? null,
    };

    // Find existing teacher/admin plan for this session+student
    let query = supabase
      .from('session_recitation_plans')
      .select('id')
      .eq('scheduled_session_id', input.scheduled_session_id)
      .neq('source', 'student_suggestion');

    if (input.student_id) {
      query = query.eq('student_id', input.student_id);
    } else {
      query = query.is('student_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return supabase
        .from('session_recitation_plans')
        .update(planData)
        .eq('id', existing.id)
        .select(PLAN_SELECT)
        .single();
    }

    return supabase
      .from('session_recitation_plans')
      .insert(planData)
      .select(PLAN_SELECT)
      .single();
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * Upsert a student suggestion.
   */
  async upsertStudentSuggestion(input: CreateRecitationPlanInput) {
    const { data: existing } = await supabase
      .from('session_recitation_plans')
      .select('id')
      .eq('scheduled_session_id', input.scheduled_session_id)
      .eq('student_id', input.student_id!)
      .eq('source', 'student_suggestion')
      .maybeSingle();

    const planData = {
      school_id: input.school_id,
      scheduled_session_id: input.scheduled_session_id,
      student_id: input.student_id!,
      set_by: input.set_by,
      selection_mode: input.selection_mode,
      start_surah: input.start_surah,
      start_ayah: input.start_ayah,
      end_surah: input.end_surah,
      end_ayah: input.end_ayah,
      rub_number: input.rub_number ?? null,
      juz_number: input.juz_number ?? null,
      hizb_number: input.hizb_number ?? null,
      recitation_type: input.recitation_type,
      source: 'student_suggestion' as const,
      assignment_id: input.assignment_id ?? null,
      notes: input.notes ?? null,
    };

    if (existing) {
      return supabase
        .from('session_recitation_plans')
        .update(planData)
        .eq('id', existing.id)
        .select(PLAN_SELECT)
        .single();
    }

    return supabase
      .from('session_recitation_plans')
      .insert(planData)
      .select(PLAN_SELECT)
      .single();
  }

  /**
   * Delete a student's own suggestion(s).
   */
  async deleteStudentSuggestion(sessionId: string, studentId: string) {
    return supabase
      .from('session_recitation_plans')
      .delete()
      .eq('scheduled_session_id', sessionId)
      .eq('student_id', studentId)
      .eq('source', 'student_suggestion');
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /**
   * Replace all student suggestions for a session with a new batch.
   * Deletes existing suggestions first, then inserts new ones.
   */
  async replaceStudentSuggestions(
    sessionId: string,
    studentId: string,
    inputs: CreateRecitationPlanInput[],
  ) {
    // 1. Delete all existing student suggestions
    const { error: deleteError } = await this.deleteStudentSuggestion(sessionId, studentId);
    if (deleteError) throw deleteError;

    if (inputs.length === 0) return { data: [], error: null };

    // 2. Batch insert all new ones
    const planData = inputs.map((input) => ({
      school_id: input.school_id,
      scheduled_session_id: input.scheduled_session_id,
      student_id: studentId,
      set_by: input.set_by,
      selection_mode: input.selection_mode,
      start_surah: input.start_surah,
      start_ayah: input.start_ayah,
      end_surah: input.end_surah,
      end_ayah: input.end_ayah,
      rub_number: input.rub_number ?? null,
      juz_number: input.juz_number ?? null,
      hizb_number: input.hizb_number ?? null,
      recitation_type: input.recitation_type,
      source: 'student_suggestion' as const,
      assignment_id: input.assignment_id ?? null,
      notes: input.notes ?? null,
    }));

    return supabase
      .from('session_recitation_plans')
      .insert(planData)
      .select('*');
  }

  /**
   * Update an existing plan by ID.
   */
  async updatePlan(planId: string, updates: UpdateRecitationPlanInput) {
    return supabase
      .from('session_recitation_plans')
      .update(updates)
      .eq('id', planId)
      .select(PLAN_SELECT)
      .single();
  }

  /**
   * Delete a single plan.
   */
  async deletePlan(planId: string) {
    return supabase
      .from('session_recitation_plans')
      .delete()
      .eq('id', planId);
  }

  /**
   * Delete all individual teacher/admin student plans for a session
   * (used before setting a unified plan). Preserves student suggestions.
   */
  async deleteStudentPlans(sessionId: string) {
    return supabase
      .from('session_recitation_plans')
      .delete()
      .eq('scheduled_session_id', sessionId)
      .not('student_id', 'is', null)
      .neq('source', 'student_suggestion');
  }

  /**
   * Get pending assignments for a student that could be suggested as plans.
   */
  async getPendingAssignments(studentId: string, sessionDate: string) {
    return supabase
      .from('memorization_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .lte('due_date', sessionDate)
      .order('due_date', { ascending: true });
  }
}

export const recitationPlanService = new RecitationPlanService();
