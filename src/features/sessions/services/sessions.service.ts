import { supabase } from '@/lib/supabase';
import type { CreateSessionInput, SessionFilters, UpdateDraftInput } from '../types/sessions.types';

const SESSION_SELECT = `
  *,
  teacher:profiles!sessions_teacher_id_fkey(full_name, name_localized, avatar_url),
  student:students!sessions_student_id_fkey(profiles!students_id_fkey(full_name, name_localized, avatar_url)),
  programs(id, name, name_ar),
  session_voice_memos(id, duration_seconds, is_expired, created_at, expires_at)
`;

class SessionsService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
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
        student_id: input.student_id,
        teacher_id: input.teacher_id,
        class_id: input.class_id ?? null,
        program_id: input.program_id ?? null,
        session_date: input.session_date ?? new Date().toISOString().split('T')[0],
        memorization_score: input.memorization_score ?? null,
        tajweed_score: input.tajweed_score ?? null,
        recitation_quality: input.recitation_quality ?? null,
        notes: input.notes ?? null,
        scheduled_session_id: input.scheduled_session_id ?? null,
        school_id: schoolId,
        status: input.status ?? 'completed',
      } as any)
      .select()
      .single();

    if (sessionError || !session) {
      return { data: null, error: sessionError };
    }

    return { data: session, error: null };
  }

  /**
   * SE-002: Update a draft session.
   */
  async updateDraft(sessionId: string, input: UpdateDraftInput) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('sessions')
      .update(input as any)
      .eq('id', sessionId)
      .eq('status', 'draft')
      .eq('teacher_id', user.id)
      .select()
      .single();
  }

  /**
   * SE-004: Delete a draft session.
   */
  async deleteDraft(sessionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('status', 'draft')
      .eq('teacher_id', user.id);
  }

  /**
   * SS-002: Retrieve a paginated, filtered list of sessions.
   * Joins teacher profile, student profile, program name, and voice memo metadata.
   */
  async getSessions(filters: SessionFilters) {
    let query = supabase
      .from('sessions')
      .select(SESSION_SELECT);

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.programId) {
      query = query.eq('program_id', filters.programId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('session_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('session_date', filters.dateTo);
    }

    query = query.order('session_date', { ascending: false });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    return query;
  }

  /**
   * SS-003: Retrieve a single session by its ID with full details.
   */
  async getSessionById(id: string) {
    return supabase
      .from('sessions')
      .select(SESSION_SELECT)
      .eq('id', id)
      .single();
  }

  /**
   * SE-008: Get teacher's assigned programs for session creation.
   */
  async getTeacherPrograms() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    return (supabase as any)
      .from('program_roles')
      .select('program_id, programs(id, name, name_ar)')
      .eq('profile_id', user.id)
      .eq('role', 'teacher');
  }
}

export const sessionsService = new SessionsService();
