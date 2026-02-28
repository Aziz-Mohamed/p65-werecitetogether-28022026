import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type {
  Session,
  SessionWithDetails,
  SessionAttendance,
  CreateDraftSessionInput,
  AddAttendanceInput,
  CompleteSessionInput,
} from '../types';

class SessionsService {
  async createDraftSession(
    input: CreateDraftSessionInput,
  ): Promise<ServiceResult<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        teacher_id: input.teacherId,
        program_id: input.programId,
        cohort_id: input.cohortId ?? null,
        meeting_link_used: input.meetingLinkUsed ?? null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async addAttendance(
    input: AddAttendanceInput,
  ): Promise<ServiceResult<SessionAttendance>> {
    const { data, error } = await supabase
      .from('session_attendance')
      .insert({
        session_id: input.sessionId,
        student_id: input.studentId,
        score: input.score ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async completeSession(
    input: CompleteSessionInput,
  ): Promise<ServiceResult<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        notes: input.notes ?? null,
        duration_minutes: input.durationMinutes ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.sessionId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async cancelSession(sessionId: string): Promise<ServiceResult<Session>> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async getSessionById(
    id: string,
  ): Promise<ServiceResult<SessionWithDetails>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        *,
        teacher_profile:profiles!sessions_teacher_id_fkey (
          id, full_name, display_name, avatar_url, meeting_link, meeting_platform
        ),
        attendance:session_attendance (
          id, student_id, score, notes, created_at
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data as unknown as SessionWithDetails };
  }

  async getSessionsByTeacher(
    teacherId: string,
    status?: string,
  ): Promise<ServiceResult<Session[]>> {
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getStudentSessions(
    studentId: string,
    status?: string,
  ): Promise<ServiceResult<Session[]>> {
    // Sessions are linked to students through session_attendance
    let query = supabase
      .from('session_attendance')
      .select('session:sessions(*)')
      .eq('student_id', studentId);

    const { data, error } = await query;

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    let sessions = (data ?? [])
      .map((row: any) => row.session)
      .filter(Boolean) as Session[];

    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }

    sessions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return { data: sessions };
  }

  async logAttendance(
    sessionId: string,
    entries: { studentId: string; score?: number; notes?: string }[],
  ): Promise<ServiceResult<SessionAttendance[]>> {
    const rows = entries.map((e) => ({
      session_id: sessionId,
      student_id: e.studentId,
      score: e.score ?? null,
      notes: e.notes ?? null,
    }));

    const { data, error } = await supabase
      .from('session_attendance')
      .insert(rows)
      .select();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async getTodayCompletedCount(
    teacherId: string,
  ): Promise<ServiceResult<number>> {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: count ?? 0 };
  }
}

export const sessionsService = new SessionsService();
