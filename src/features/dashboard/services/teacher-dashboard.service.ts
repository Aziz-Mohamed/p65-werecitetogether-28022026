import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
interface TeacherRecentSession extends Tables<'scheduled_sessions'> {
  class: Pick<Tables<'classes'>, 'name' | 'name_localized'> | null;
  student: {
    profiles: Pick<Tables<'profiles'>, 'full_name' | 'name_localized' | 'avatar_url'> | null;
  } | null;
  evaluation: Pick<Tables<'sessions'>, 'memorization_score'> | null;
}

interface TeacherDashboardResult {
  todaySessionCount: number;
  todayStudentsSeen: number;
  totalStudents: number;
  recentSessions: TeacherRecentSession[];
  checkin: Tables<'teacher_checkins'> | null;
}

class TeacherDashboardService {
  async getDashboard(teacherId: string): Promise<TeacherDashboardResult> {
    const today = new Date().toISOString().split('T')[0];

    // Run queries in parallel
    const [todaySessionsRes, classesRes, recentSessionsRes, checkinRes] =
      await Promise.all([
        // Today's sessions by this teacher
        supabase
          .from('sessions')
          .select('id, student_id')
          .eq('teacher_id', teacherId)
          .eq('session_date', today),

        // Classes this teacher is assigned to, with student counts
        supabase
          .from('classes')
          .select('id, students(id)')
          .eq('teacher_id', teacherId),

        // Recent scheduled sessions (last 5)
        supabase
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
          .order('session_date', { ascending: false })
          .order('start_time', { ascending: false })
          .limit(5),

        // Today's check-in
        supabase
          .from('teacher_checkins')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('date', today)
          .maybeSingle(),
      ]);

    const todaySessions = todaySessionsRes.data ?? [];
    const uniqueStudents = new Set(todaySessions.map((s) => s.student_id));

    // Count total students across teacher's classes
    const totalStudents = (classesRes.data ?? []).reduce(
      (sum, c) => sum + ((c.students as unknown[] | null)?.length ?? 0),
      0,
    );

    return {
      todaySessionCount: todaySessions.length,
      todayStudentsSeen: uniqueStudents.size,
      totalStudents,
      recentSessions: (recentSessionsRes.data ?? []) as unknown as TeacherRecentSession[],
      checkin: checkinRes.data,
    };
  }
}

export const teacherDashboardService = new TeacherDashboardService();
