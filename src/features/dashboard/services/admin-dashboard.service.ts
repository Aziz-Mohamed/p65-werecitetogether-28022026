import { supabase } from '@/lib/supabase';

class AdminDashboardService {
  /**
   * DS-004: Get admin dashboard summary statistics.
   * Runs parallel queries for student/teacher/class counts and today's attendance rate.
   *
   * @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5.
   */
  async getDashboard(schoolId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [studentsResult, teachersResult, classesResult, totalAttendanceResult, presentAttendanceResult] =
      await Promise.all([
        // Total active students
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('is_active', true),

        // Total teachers
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('role', 'teacher'),

        // Total active classes
        supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('is_active', true),

        // Today's total attendance records
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('date', today),

        // Today's present attendance records
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('date', today)
          .eq('status', 'present'),
      ]);

    const totalStudents = studentsResult.count ?? 0;
    const totalTeachers = teachersResult.count ?? 0;
    const totalClasses = classesResult.count ?? 0;

    const totalAttendance = totalAttendanceResult.count ?? 0;
    const presentAttendance = presentAttendanceResult.count ?? 0;
    const todayAttendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendanceRate,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
