import { supabase } from '@/lib/supabase';
import type {
  CohortFilters,
  EnrollInput,
  CreateCohortInput,
  UpdateProgramInput,
  CreateTrackInput,
  AssignRoleInput,
} from '../types/programs.types';

class ProgramsService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /** PR-001: List active programs ordered by sort_order */
  async getPrograms() {
    return supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
  }

  /** PR-002: Get program detail with active tracks */
  async getProgram(id: string) {
    return supabase
      .from('programs')
      .select(`
        *,
        program_tracks (
          id, name, name_ar, description, description_ar,
          track_type, curriculum, sort_order, is_active
        )
      `)
      .eq('id', id)
      .eq('program_tracks.is_active', true)
      .order('sort_order', { referencedTable: 'program_tracks', ascending: true })
      .single();
  }

  /** PR-003: List cohorts for a track/program */
  async getCohorts(filters: CohortFilters) {
    let query = supabase
      .from('cohorts')
      .select(`
        *,
        profiles!cohorts_teacher_id_fkey ( id, full_name, meeting_link ),
        enrollments ( count )
      `)
      .eq('program_id', filters.programId)
      .in('status', ['enrollment_open', 'enrollment_closed', 'in_progress'])
      .order('created_at', { ascending: false });

    if (filters.trackId) {
      query = query.eq('track_id', filters.trackId);
    }

    return query;
  }

  /** PR-004: Get student's enrollments with program/track/cohort details */
  async getMyEnrollments(userId: string) {
    return supabase
      .from('enrollments')
      .select(`
        *,
        programs ( id, name, name_ar, category ),
        program_tracks ( id, name, name_ar ),
        cohorts ( id, name, status, teacher_id,
          profiles!cohorts_teacher_id_fkey ( full_name )
        )
      `)
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });
  }

  /** PR-005: Get program roles with profile info */
  async getProgramRoles(programId: string) {
    return supabase
      .from('program_roles')
      .select(`
        *,
        profiles!program_roles_profile_id_fkey ( id, full_name, role )
      `)
      .eq('program_id', programId)
      .order('role');
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  /** PR-006: Enroll in structured program via RPC */
  async enrollStructured(input: EnrollInput) {
    return supabase.rpc('enroll_student', {
      p_program_id: input.programId,
      p_track_id: input.trackId ?? null,
      p_cohort_id: input.cohortId ?? null,
    });
  }

  /** PR-007: Join free program via direct insert */
  async joinFreeProgram(userId: string, programId: string, trackId?: string) {
    return supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        program_id: programId,
        track_id: trackId ?? null,
        status: 'active',
      })
      .select()
      .single();
  }

  /** PR-008: Leave/drop program */
  async leaveProgram(enrollmentId: string, userId: string) {
    return supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollmentId)
      .eq('student_id', userId)
      .select()
      .single();
  }

  /** PR-009: Approve/reject enrollment */
  async updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'dropped') {
    return supabase
      .from('enrollments')
      .update({ status })
      .eq('id', enrollmentId)
      .select()
      .single();
  }

  /** PR-010: Create cohort */
  async createCohort(input: CreateCohortInput) {
    return supabase
      .from('cohorts')
      .insert({
        program_id: input.programId,
        track_id: input.trackId ?? null,
        name: input.name,
        max_students: input.maxStudents,
        teacher_id: input.teacherId,
        supervisor_id: input.supervisorId ?? null,
        meeting_link: input.meetingLink ?? null,
        schedule: input.schedule ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        status: 'enrollment_open',
      })
      .select()
      .single();
  }

  /** PR-011: Update cohort status */
  async updateCohortStatus(cohortId: string, status: string) {
    return supabase
      .from('cohorts')
      .update({ status })
      .eq('id', cohortId)
      .select()
      .single();
  }

  /** Update program details */
  async updateProgram(programId: string, input: UpdateProgramInput) {
    return supabase
      .from('programs')
      .update(input)
      .eq('id', programId)
      .select()
      .single();
  }

  /** Create new program (master_admin only) */
  async createProgram(input: UpdateProgramInput) {
    return supabase
      .from('programs')
      .insert(input)
      .select()
      .single();
  }

  /** Create new track */
  async createTrack(input: CreateTrackInput) {
    return supabase
      .from('program_tracks')
      .insert({
        program_id: input.programId,
        name: input.name,
        name_ar: input.name_ar,
        description: input.description ?? null,
        description_ar: input.description_ar ?? null,
        track_type: input.trackType ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single();
  }

  /** PR-012: Assign program role */
  async assignProgramRole(input: AssignRoleInput, assignedBy: string) {
    return supabase
      .from('program_roles')
      .insert({
        profile_id: input.profileId,
        program_id: input.programId,
        role: input.role,
        assigned_by: assignedBy,
      })
      .select()
      .single();
  }

  /** PR-013: Remove program role */
  async removeProgramRole(roleId: string) {
    return supabase
      .from('program_roles')
      .delete()
      .eq('id', roleId);
  }

  /** Bulk update enrollments for cohort status transition (in_progress → approve all pending) */
  async bulkApproveEnrollments(cohortId: string) {
    return supabase
      .from('enrollments')
      .update({ status: 'active' })
      .eq('cohort_id', cohortId)
      .eq('status', 'pending');
  }

  /** Get enrollments for a specific cohort (admin view) */
  async getCohortEnrollments(cohortId: string) {
    return supabase
      .from('enrollments')
      .select(`
        *,
        profiles:student_id ( id, full_name )
      `)
      .eq('cohort_id', cohortId)
      .order('enrolled_at', { ascending: true });
  }

  /** Get all programs (admin — no is_active filter) */
  async getAllPrograms() {
    return supabase
      .from('programs')
      .select('*')
      .order('sort_order', { ascending: true });
  }
}

export const programsService = new ProgramsService();
