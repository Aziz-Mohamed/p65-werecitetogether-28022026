import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type {
  Enrollment,
  EnrollmentWithDetails,
  EnrollmentWithProfile,
  EnrollInput,
} from '../types';

class EnrollmentService {
  async enroll(input: EnrollInput): Promise<ServiceResult<Enrollment>> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: input.studentId,
        program_id: input.programId,
        track_id: input.trackId ?? null,
        cohort_id: input.cohortId ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async approveEnrollment(enrollmentId: string): Promise<ServiceResult<Enrollment>> {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'approved' })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async dropEnrollment(enrollmentId: string): Promise<ServiceResult<void>> {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollmentId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: undefined };
  }

  async getEnrollmentsByStudent(
    studentId: string,
  ): Promise<ServiceResult<EnrollmentWithDetails[]>> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        programs!enrollments_program_id_fkey(id, name, name_ar),
        program_tracks!enrollments_track_id_fkey(id, name, name_ar),
        cohorts!enrollments_cohort_id_fkey(id, name, status),
        teacher:profiles!enrollments_teacher_id_fkey(id, full_name, display_name, avatar_url)
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      program: row.programs ?? undefined,
      track: row.program_tracks ?? null,
      cohort: row.cohorts ?? null,
      teacher_profile: row.teacher ?? null,
      programs: undefined,
      program_tracks: undefined,
      cohorts: undefined,
      teacher: undefined,
    })) as EnrollmentWithDetails[];

    return { data: mapped };
  }

  async getEnrollmentsByCohort(
    cohortId: string,
  ): Promise<ServiceResult<EnrollmentWithProfile[]>> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(id, full_name, display_name, avatar_url)
      `)
      .eq('cohort_id', cohortId)
      .neq('status', 'dropped')
      .order('enrolled_at');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      student_profile: row.student ?? undefined,
      student: undefined,
    })) as EnrollmentWithProfile[];

    return { data: mapped };
  }

  async getEnrollmentsByProgram(
    programId: string,
  ): Promise<ServiceResult<Enrollment[]>> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('program_id', programId)
      .neq('status', 'dropped')
      .order('enrolled_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getPendingEnrollmentsByCohort(
    cohortId: string,
  ): Promise<ServiceResult<EnrollmentWithProfile[]>> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:profiles!enrollments_student_id_fkey(id, full_name, display_name, avatar_url)
      `)
      .eq('cohort_id', cohortId)
      .eq('status', 'pending')
      .order('enrolled_at');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      student_profile: row.student ?? undefined,
      student: undefined,
    })) as EnrollmentWithProfile[];

    return { data: mapped };
  }
}

export const enrollmentService = new EnrollmentService();
