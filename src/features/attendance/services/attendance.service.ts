import { supabase } from '@/lib/supabase';
import type { BulkAttendanceInput } from '../types/attendance.types';

class AttendanceService {
  /**
   * AT-001: Mark bulk attendance for a class on a given date.
   * Uses upsert on (student_id, date) to handle re-submissions.
   *
   * @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5.
   */
  async markBulkAttendance(input: BulkAttendanceInput, schoolId: string, markedBy: string) {
    const rows = input.records.map((r) => ({
      student_id: r.student_id,
      class_id: input.class_id,
      date: input.date,
      status: r.status,
      notes: r.notes ?? null,
      school_id: schoolId,
      marked_by: markedBy,
      scheduled_session_id: input.scheduled_session_id ?? null,
    }));

    return supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,date' })
      .select();
  }

  /**
   * AT-002: Get attendance calendar for a student in a given month.
   * Returns one row per day the student has a record.
   */
  async getAttendanceCalendar(studentId: string, month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    return supabase
      .from('attendance')
      .select('date, status, notes')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('date');
  }

  /**
   * AT-003: Get attendance rate for a student (all-time).
   * Returns breakdown counts and overall rate.
   */
  async getAttendanceRate(studentId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    if (error) return { data: null, error };

    const total = data.length;
    const present = data.filter((r) => r.status === 'present').length;
    const absent = data.filter((r) => r.status === 'absent').length;
    const late = data.filter((r) => r.status === 'late').length;
    const excused = data.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      data: { rate, total, present, absent, late, excused },
      error: null,
    };
  }

  /**
   * AT-004: Get class attendance for a specific date.
   * Returns attendance records with student profile info.
   */
  async getClassAttendance(classId: string, date: string) {
    return supabase
      .from('attendance')
      .select('*, students!inner(id, profiles!students_id_fkey!inner(full_name, name_localized))')
      .eq('class_id', classId)
      .eq('date', date)
      .order('student_id');
  }
}

export const attendanceService = new AttendanceService();
