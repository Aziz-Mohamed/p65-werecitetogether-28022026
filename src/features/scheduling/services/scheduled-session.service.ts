import { supabase } from '@/lib/supabase';
import type { ScheduleSessionInput, ScheduleFilters, SessionStatus } from '../types/scheduling.types';

class ScheduledSessionService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Get scheduled sessions with filters.
   */
  async getScheduledSessions(filters: ScheduleFilters) {
    let query = supabase
      .from('scheduled_sessions')
      .select(`
        *,
        class:classes!scheduled_sessions_class_id_fkey(name, name_localized),
        teacher:profiles!scheduled_sessions_teacher_id_fkey(full_name, name_localized, avatar_url),
        student:students!scheduled_sessions_student_id_fkey(
          profiles!students_id_fkey(full_name, name_localized, avatar_url)
        )
      `)
      .eq('school_id', filters.schoolId);

    if (filters.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.startDate) {
      query = query.gte('session_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('session_date', filters.endDate);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    return query.order('session_date', { ascending: true }).order('start_time', { ascending: true });
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Get upcoming sessions for a teacher.
   */
  async getTeacherUpcoming(teacherId: string, schoolId: string) {
    const today = new Date().toISOString().split('T')[0];
    return supabase
      .from('scheduled_sessions')
      .select(`
        *,
        class:classes!scheduled_sessions_class_id_fkey(name, name_localized),
        student:students!scheduled_sessions_student_id_fkey(
          profiles!students_id_fkey(full_name, name_localized, avatar_url)
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('school_id', schoolId)
      .gte('session_date', today)
      .in('status', ['scheduled', 'in_progress'])
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Get upcoming sessions for a student (via class membership or individual).
   */
  async getStudentUpcoming(studentId: string, classIds: string[], schoolId: string) {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('scheduled_sessions')
      .select(`
        *,
        class:classes!scheduled_sessions_class_id_fkey(name, name_localized),
        teacher:profiles!scheduled_sessions_teacher_id_fkey(full_name, name_localized, avatar_url)
      `)
      .eq('school_id', schoolId)
      .gte('session_date', today)
      .in('status', ['scheduled', 'in_progress'])
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);

    // Student sees: class sessions for their classes + individual sessions assigned to them
    if (classIds.length > 0) {
      query = query.or(
        `student_id.eq.${studentId},and(session_type.eq.class,class_id.in.(${classIds.join(',')}))`
      );
    } else {
      query = query.eq('student_id', studentId);
    }

    return query;
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Get completed/cancelled/missed sessions for a teacher (history).
   */
  async getTeacherHistory(teacherId: string, schoolId: string) {
    return supabase
      .from('scheduled_sessions')
      .select(`
        *,
        class:classes!scheduled_sessions_class_id_fkey(name, name_localized),
        student:students!scheduled_sessions_student_id_fkey(
          profiles!students_id_fkey(full_name, name_localized, avatar_url)
        ),
        evaluation:sessions!scheduled_sessions_evaluation_session_id_fkey(memorization_score)
      `)
      .eq('teacher_id', teacherId)
      .eq('school_id', schoolId)
      .in('status', ['completed', 'cancelled', 'missed'])
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(50);
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Create a scheduled session (manual/individual).
   */
  async createSession(input: ScheduleSessionInput) {
    return supabase
      .from('scheduled_sessions')
      .insert({
        class_id: input.classId ?? null,
        class_schedule_id: input.classScheduleId ?? null,
        teacher_id: input.teacherId,
        student_id: input.studentId ?? null,
        school_id: input.schoolId,
        session_date: input.sessionDate,
        start_time: input.startTime,
        end_time: input.endTime,
        session_type: input.sessionType,
        status: 'scheduled',
      })
      .select()
      .single();
  }

  /**
   * Update session status.
   */
  async updateStatus(sessionId: string, status: SessionStatus) {
    return supabase
      .from('scheduled_sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();
  }

  /**
   * Link a scheduled session to an evaluation session.
   */
  async linkEvaluation(sessionId: string, evaluationSessionId: string) {
    return supabase
      .from('scheduled_sessions')
      .update({ evaluation_session_id: evaluationSessionId })
      .eq('id', sessionId)
      .select()
      .single();
  }

  /**
   * Cancel a scheduled session.
   */
  async cancelSession(sessionId: string) {
    return this.updateStatus(sessionId, 'cancelled');
  }

  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  /**
   * Fetch the full completion summary for a scheduled session:
   * attendance records + evaluation sessions with nested recitations.
   *
   * Uses `scheduled_session_id` FK (new flow). Falls back to the legacy
   * `evaluation_session_id` linkage for sessions completed before the migration.
   */
  async getCompletedSessionSummary(scheduledSessionId: string) {
    const evalSelect = `
      id, student_id, memorization_score, tajweed_score, recitation_quality, notes,
      student:students!sessions_student_id_fkey(
        id,
        profiles!students_id_fkey(full_name, name_localized, avatar_url)
      ),
      recitations(
        id, surah_number, from_ayah, to_ayah, recitation_type,
        accuracy_score, tajweed_score, fluency_score,
        needs_repeat, mistake_notes, created_at
      )
    `;

    const [attendanceResult, evaluationsResult] = await Promise.all([
      supabase
        .from('attendance')
        .select(`
          id, student_id, status, notes,
          students!inner(
            id,
            profiles!students_id_fkey!inner(full_name, name_localized, avatar_url)
          )
        `)
        .eq('scheduled_session_id', scheduledSessionId)
        .order('student_id'),
      supabase
        .from('sessions')
        .select(evalSelect)
        .eq('scheduled_session_id', scheduledSessionId)
        .order('created_at', { ascending: true }),
    ]);

    // Fallback for sessions completed before the scheduled_session_id migration:
    // use the legacy evaluation_session_id FK to find evaluation records.
    if (!evaluationsResult.error && (evaluationsResult.data?.length ?? 0) === 0) {
      const { data: scheduled } = await supabase
        .from('scheduled_sessions')
        .select('evaluation_session_id, teacher_id, class_id, session_date')
        .eq('id', scheduledSessionId)
        .single();

      if (scheduled?.evaluation_session_id) {
        // Find all evaluation sessions by the same teacher/class/date
        let fallbackQuery = supabase
          .from('sessions')
          .select(evalSelect)
          .eq('teacher_id', scheduled.teacher_id)
          .eq('session_date', scheduled.session_date)
          .order('created_at', { ascending: true });

        if (scheduled.class_id) {
          fallbackQuery = fallbackQuery.eq('class_id', scheduled.class_id);
        }

        const fallbackResult = await fallbackQuery;
        return {
          attendance: { data: attendanceResult.data, error: attendanceResult.error },
          evaluations: { data: fallbackResult.data, error: fallbackResult.error },
        };
      }
    }

    return {
      attendance: { data: attendanceResult.data, error: attendanceResult.error },
      evaluations: { data: evaluationsResult.data, error: evaluationsResult.error },
    };
  }
}

export const scheduledSessionService = new ScheduledSessionService();
