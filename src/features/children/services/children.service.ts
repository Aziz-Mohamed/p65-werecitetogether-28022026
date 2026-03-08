import { supabase } from '@/lib/supabase';

class ChildrenService {
  /**
   * CH-001: Get all children (students) for a parent.
   */
  async getChildren(parentId: string) {
    return supabase
      .from('students')
      .select('*, profiles!students_id_fkey!inner(full_name, name_localized, username, avatar_url), classes(name, name_localized)')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('full_name', { referencedTable: 'profiles', ascending: true });
  }

  /**
   * CH-002: Get detailed info for a single child.
   * Includes profile, class, level, recent sessions, sticker count.
   */
  async getChildDetail(studentId: string) {
    const [studentResult, sessionsResult, stickerCountResult] = await Promise.all([
      supabase
        .from('students')
        .select('*, profiles!students_id_fkey!inner(full_name, name_localized, username, avatar_url), classes(name, name_localized, id)')
        .eq('id', studentId)
        .single(),
      supabase
        .from('sessions')
        .select('id, session_date, memorization_score, tajweed_score, recitation_quality, notes')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false })
        .limit(5),
      supabase
        .from('student_stickers')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId),
    ]);

    return {
      student: studentResult.data,
      studentError: studentResult.error,
      recentSessions: sessionsResult.data,
      sessionsError: sessionsResult.error,
      stickerCount: stickerCountResult.count ?? 0,
      stickerError: stickerCountResult.error,
    };
  }

  /**
   * CH-003: Get anonymous class standing for a student.
   * Returns ranks with no names — only current student is identified.
   *
   * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
   */
  async getClassStanding(studentId: string, classId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('id, current_level')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('current_level', { ascending: false });

    if (error) return { data: null, error };

    const standings = (data ?? []).map((s, index) => ({
      rank: index + 1,
      level: s.current_level,
      isCurrentStudent: s.id === studentId,
    }));

    return { data: standings, error: null };
  }
}

export const childrenService = new ChildrenService();
