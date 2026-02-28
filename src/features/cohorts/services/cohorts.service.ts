import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { Cohort, CohortWithDetails, CohortStatus, CreateCohortInput, UpdateCohortInput } from '../types';

class CohortsService {
  async createCohort(input: CreateCohortInput): Promise<ServiceResult<Cohort>> {
    const { data, error } = await supabase
      .from('cohorts')
      .insert({
        program_id: input.programId,
        name: input.name,
        track_id: input.trackId ?? null,
        max_students: input.maxStudents ?? 25,
        teacher_id: input.teacherId ?? null,
        supervisor_id: input.supervisorId ?? null,
        meeting_link: input.meetingLink ?? null,
        schedule: input.schedule ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        status: 'enrollment_open' as string,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async updateCohort(
    id: string,
    input: UpdateCohortInput,
  ): Promise<ServiceResult<Cohort>> {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.trackId !== undefined) updateData.track_id = input.trackId;
    if (input.maxStudents !== undefined) updateData.max_students = input.maxStudents;
    if (input.teacherId !== undefined) updateData.teacher_id = input.teacherId;
    if (input.supervisorId !== undefined) updateData.supervisor_id = input.supervisorId;
    if (input.meetingLink !== undefined) updateData.meeting_link = input.meetingLink;
    if (input.schedule !== undefined) updateData.schedule = input.schedule;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;

    const { data, error } = await supabase
      .from('cohorts')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async updateCohortStatus(
    id: string,
    status: CohortStatus,
  ): Promise<ServiceResult<Cohort>> {
    const { data, error } = await supabase
      .from('cohorts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getCohortsByProgram(programId: string): Promise<ServiceResult<Cohort[]>> {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getCohortById(id: string): Promise<ServiceResult<CohortWithDetails>> {
    const { data, error } = await supabase
      .from('cohorts')
      .select(`
        *,
        programs!cohorts_program_id_fkey(id, name, name_ar),
        program_tracks!cohorts_track_id_fkey(id, name, name_ar),
        teacher:profiles!cohorts_teacher_id_fkey(id, full_name, display_name, avatar_url),
        supervisor:profiles!cohorts_supervisor_id_fkey(id, full_name, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    const cohort = data as any;
    const result: CohortWithDetails = {
      ...cohort,
      program: cohort.programs ?? undefined,
      track: cohort.program_tracks ?? null,
      teacher_profile: cohort.teacher ?? null,
      supervisor_profile: cohort.supervisor ?? null,
    };
    delete (result as any).programs;
    delete (result as any).program_tracks;
    delete (result as any).teacher;
    delete (result as any).supervisor;

    return { data: result };
  }
}

export const cohortsService = new CohortsService();
