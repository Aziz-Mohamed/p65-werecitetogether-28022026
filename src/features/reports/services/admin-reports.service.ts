import { supabase } from '@/lib/supabase';
import i18n from '@/i18n/config';
import type {
  DateRange,
  SchoolKPISummary,
  AttendanceTrendPoint,
  ScoreDistributionBucket,
  ScoreRange,
  LevelDistributionBucket,
  TeacherActivitySummary,
  TeacherAttendanceKPI,
  SessionCompletionStat,
} from '../types/reports.types';

const SCORE_RANGES: Array<{
  range: ScoreRange;
  labelKey: string;
  min: number;
  max: number;
  inclusive: boolean;
}> = [
  { range: '1-2', labelKey: 'reports.scoreRange.needsImprovement', min: 1, max: 2, inclusive: false },
  { range: '2-3', labelKey: 'reports.scoreRange.developing', min: 2, max: 3, inclusive: false },
  { range: '3-4', labelKey: 'reports.scoreRange.proficient', min: 3, max: 4, inclusive: false },
  { range: '4-5', labelKey: 'reports.scoreRange.excellent', min: 4, max: 5, inclusive: true },
];

class AdminReportsService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getSchoolKPIs(
    schoolId: string,
    dateRange: DateRange,
  ): Promise<SchoolKPISummary> {
    const [
      studentsResult,
      teachersResult,
      classesResult,
      attendanceResult,
      scoresResult,
      stickersResult,
    ] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'teacher'),
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true),
      supabase
        .from('attendance')
        .select('status')
        .eq('school_id', schoolId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate),
      supabase
        .from('sessions')
        .select('student_id, memorization_score, tajweed_score, recitation_quality')
        .eq('school_id', schoolId)
        .gte('session_date', dateRange.startDate)
        .lte('session_date', dateRange.endDate),
      supabase
        .from('student_stickers')
        .select('id', { count: 'exact', head: true })
        .gte('awarded_at', dateRange.startDate)
        .lt('awarded_at', dateRange.endDate + 'T23:59:59.999Z'),
    ]);

    // Attendance rate
    let attendanceRate = 0;
    if (attendanceResult.data) {
      const present = attendanceResult.data.filter((r) => r.status === 'present').length;
      const absent = attendanceResult.data.filter((r) => r.status === 'absent').length;
      const late = attendanceResult.data.filter((r) => r.status === 'late').length;
      const denominator = present + absent + late;
      attendanceRate = denominator > 0 ? Math.round(((present + late) / denominator) * 100 * 10) / 10 : 0;
    }

    // Two-level mean: per-student avg, then mean of student avgs
    let averageScore = 0;
    if (scoresResult.data && scoresResult.data.length > 0) {
      const studentScores = new Map<string, number[]>();
      for (const s of scoresResult.data) {
        const scores: number[] = [];
        if (s.memorization_score != null) scores.push(s.memorization_score);
        if (s.tajweed_score != null) scores.push(s.tajweed_score);
        if (s.recitation_quality != null) scores.push(s.recitation_quality);
        if (scores.length === 0) continue;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const existing = studentScores.get(s.student_id) ?? [];
        existing.push(avg);
        studentScores.set(s.student_id, existing);
      }

      if (studentScores.size > 0) {
        const studentAvgs: number[] = [];
        for (const sessions of studentScores.values()) {
          studentAvgs.push(sessions.reduce((a, b) => a + b, 0) / sessions.length);
        }
        averageScore =
          Math.round(
            (studentAvgs.reduce((a, b) => a + b, 0) / studentAvgs.length) * 10,
          ) / 10;
      }
    }

    return {
      activeStudents: studentsResult.count ?? 0,
      activeTeachers: teachersResult.count ?? 0,
      totalClasses: classesResult.count ?? 0,
      attendanceRate,
      averageScore,
      totalStickersAwarded: stickersResult.count ?? 0,
    };
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getAttendanceTrend(
    schoolId: string,
    dateRange: DateRange,
    classId?: string,
  ): Promise<AttendanceTrendPoint[]> {
    const { data, error } = await supabase.rpc('get_attendance_trend', {
      p_school_id: schoolId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
      p_granularity: dateRange.granularity,
      p_class_id: classId,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.bucket_date,
      present: row.present_count,
      absent: row.absent_count,
      late: row.late_count,
      excused: row.excused_count,
      rate: Number(row.attendance_rate) || 0,
    }));
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getScoreDistribution(
    schoolId: string,
    dateRange: DateRange,
    classId?: string,
  ): Promise<ScoreDistributionBucket[]> {
    let query = supabase
      .from('sessions')
      .select('student_id, memorization_score, tajweed_score, recitation_quality')
      .eq('school_id', schoolId)
      .gte('session_date', dateRange.startDate)
      .lte('session_date', dateRange.endDate);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Per-student average
    const studentScores = new Map<string, number[]>();
    for (const s of data ?? []) {
      const scores: number[] = [];
      if (s.memorization_score != null) scores.push(s.memorization_score);
      if (s.tajweed_score != null) scores.push(s.tajweed_score);
      if (s.recitation_quality != null) scores.push(s.recitation_quality);
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const existing = studentScores.get(s.student_id) ?? [];
      existing.push(avg);
      studentScores.set(s.student_id, existing);
    }

    // Bucket into ranges: [1,2) [2,3) [3,4) [4,5]
    const buckets: ScoreDistributionBucket[] = SCORE_RANGES.map((r) => ({
      range: r.range,
      label: i18n.t(r.labelKey),
      count: 0,
    }));

    for (const sessions of studentScores.values()) {
      const studentAvg = sessions.reduce((a, b) => a + b, 0) / sessions.length;
      for (let i = 0; i < SCORE_RANGES.length; i++) {
        const r = SCORE_RANGES[i];
        if (r.inclusive) {
          if (studentAvg >= r.min && studentAvg <= r.max) {
            buckets[i].count++;
            break;
          }
        } else {
          if (studentAvg >= r.min && studentAvg < r.max) {
            buckets[i].count++;
            break;
          }
        }
      }
    }

    return buckets;
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getLevelDistribution(
    schoolId: string,
    classId?: string,
  ): Promise<LevelDistributionBucket[]> {
    let query = supabase
      .from('students')
      .select('current_level')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const levelCounts = new Map<number, { title: string; count: number }>();
    for (const student of data ?? []) {
      const levelNum = student.current_level ?? 0;
      const title = `Level ${levelNum}`;
      const existing = levelCounts.get(levelNum);
      if (existing) {
        existing.count++;
      } else {
        levelCounts.set(levelNum, { title, count: 1 });
      }
    }

    return Array.from(levelCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([levelNumber, { title, count }]) => ({
        levelNumber,
        title,
        count,
      }));
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getTeacherActivity(
    schoolId: string,
    dateRange: DateRange,
  ): Promise<TeacherActivitySummary[]> {
    const { data, error } = await supabase.rpc('get_teacher_activity', {
      p_school_id: schoolId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      teacherId: row.teacher_id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      sessionsLogged: row.sessions_logged,
      uniqueStudentsEvaluated: row.unique_students,
      stickersAwarded: row.stickers_awarded,
      lastActiveDate: row.last_active_date,
    }));
  }
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getTeacherAttendanceKPIs(
    schoolId: string,
    dateRange: DateRange,
  ): Promise<TeacherAttendanceKPI[]> {
    const { data, error } = await supabase.rpc('get_teacher_attendance_kpis', {
      p_school_id: schoolId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      teacherId: row.teacher_id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      daysPresent: row.days_present,
      daysOnTime: row.days_on_time,
      daysLate: row.days_late,
      totalHoursWorked: Number(row.total_hours_worked) || 0,
      avgHoursPerDay: Number(row.avg_hours_per_day) || 0,
      punctualityRate: Number(row.punctuality_rate) || 0,
    }));
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async getSessionCompletionStats(
    schoolId: string,
    dateRange: DateRange,
  ): Promise<SessionCompletionStat[]> {
    const { data, error } = await supabase.rpc('get_session_completion_stats', {
      p_school_id: schoolId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      teacherId: row.teacher_id,
      fullName: row.full_name,
      totalScheduled: row.total_scheduled,
      completedCount: row.completed_count,
      cancelledCount: row.cancelled_count,
      missedCount: row.missed_count,
      completionRate: Number(row.completion_rate) || 0,
    }));
  }
}

export const adminReportsService = new AdminReportsService();
