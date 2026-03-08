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
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * SS-001: Create a new session record.
   * Looks up the teacher's school_id from their profile and inserts the session.
   */
  async createSession(input: CreateSessionInput) {
    // Fetch the teacher's school_id from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', input.teacher_id)
      .single();

    if (profileError || !profile) {
      return { data: null, error: profileError ?? new Error('Teacher profile not found') };
    }

    const schoolId = profile.school_id;

    // Insert the session record
    const { data: session, error: sessionError } = await supabase
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

  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * SS-002: Retrieve a paginated, filtered list of sessions.
   * Joins teacher profile and student profile.
   */
  async getSessions(filters: SessionFilters) {
    let query = supabase
      .from('sessions')
      .select(
        '*, teacher:profiles!sessions_teacher_id_fkey(full_name, name_localized, avatar_url), student:students!sessions_student_id_fkey(profiles!students_id_fkey(full_name, name_localized, avatar_url))',
      );

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

  async getActiveDraftSession(
    studentId: string,
  ): Promise<ServiceResult<SessionWithDetails | null>> {
    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        *,
        teacher_profile:profiles!sessions_teacher_id_fkey (
          id, full_name, display_name, avatar_url,
          meeting_link, meeting_platform
        ),
        attendance:session_attendance!inner (student_id)
      `,
      )
      .eq('attendance.student_id', studentId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data as unknown as SessionWithDetails | null };
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
