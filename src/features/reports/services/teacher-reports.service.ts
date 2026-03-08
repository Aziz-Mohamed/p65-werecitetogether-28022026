import { supabase } from '@/lib/supabase';
import type {
  DateRange,
  ClassAnalytics,
  ScoreTrendPoint,
  AttendanceTrendPoint,
  StudentNeedingAttention,
  LevelDistributionBucket,
} from '../types/reports.types';

class TeacherReportsService {
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  async getClassAnalytics(
    classId: string,
    dateRange: DateRange,
  ): Promise<ClassAnalytics> {
    const [classInfo, attendanceData, scoresData, levelData] = await Promise.all([
      supabase
        .from('classes')
        .select('id, name, name_localized')
        .eq('id', classId)
        .single(),
      supabase
        .from('attendance')
        .select('status')
        .eq('class_id', classId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate),
      supabase
        .from('sessions')
        .select('memorization_score, tajweed_score, recitation_quality')
        .eq('class_id', classId)
        .gte('session_date', dateRange.startDate)
        .lte('session_date', dateRange.endDate),
      supabase
        .from('students')
        .select('id, current_level')
        .eq('class_id', classId)
        .eq('is_active', true),
    ]);

    if (classInfo.error) throw classInfo.error;

    // Attendance rate
    let attendanceRate = 0;
    if (attendanceData.data) {
      const present = attendanceData.data.filter((r) => r.status === 'present').length;
      const absent = attendanceData.data.filter((r) => r.status === 'absent').length;
      const late = attendanceData.data.filter((r) => r.status === 'late').length;
      const denom = present + absent + late;
      attendanceRate = denom > 0 ? Math.round(((present + late) / denom) * 100 * 10) / 10 : 0;
    }

    // Average scores
    let avgMem = 0, avgTaj = 0, avgRec = 0;
    if (scoresData.data && scoresData.data.length > 0) {
      const validScores = scoresData.data.filter(
        (s) => s.memorization_score != null || s.tajweed_score != null || s.recitation_quality != null,
      );
      if (validScores.length > 0) {
        const memScores = validScores.filter((s) => s.memorization_score != null).map((s) => s.memorization_score!);
        const tajScores = validScores.filter((s) => s.tajweed_score != null).map((s) => s.tajweed_score!);
        const recScores = validScores.filter((s) => s.recitation_quality != null).map((s) => s.recitation_quality!);
        avgMem = memScores.length > 0 ? memScores.reduce((a, b) => a + b, 0) / memScores.length : 0;
        avgTaj = tajScores.length > 0 ? tajScores.reduce((a, b) => a + b, 0) / tajScores.length : 0;
        avgRec = recScores.length > 0 ? recScores.reduce((a, b) => a + b, 0) / recScores.length : 0;
      }
    }

    // Level distribution
    const levelCounts = new Map<number, { title: string; count: number }>();
    for (const student of levelData.data ?? []) {
      const levelNum = student.current_level ?? 0;
      const title = `Level ${levelNum}`;
      const existing = levelCounts.get(levelNum);
      if (existing) existing.count++;
      else levelCounts.set(levelNum, { title, count: 1 });
    }

    const levelDistribution: LevelDistributionBucket[] = Array.from(levelCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([levelNumber, { title, count }]) => ({ levelNumber, title, count }));

    return {
      classId,
      className: classInfo.data.name,
      studentCount: levelData.data?.length ?? 0,
      attendanceRate,
      averageMemorization: Math.round(avgMem * 10) / 10,
      averageTajweed: Math.round(avgTaj * 10) / 10,
      averageRecitation: Math.round(avgRec * 10) / 10,
      levelDistribution,
    };
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  async getClassScoreTrend(
    schoolId: string,
    classId: string,
    dateRange: DateRange,
  ): Promise<ScoreTrendPoint[]> {
    const { data, error } = await supabase.rpc('get_score_trend', {
      p_school_id: schoolId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
      p_granularity: dateRange.granularity,
      p_class_id: classId,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.bucket_date,
      memorization: Number(row.avg_memorization) || 0,
      tajweed: Number(row.avg_tajweed) || 0,
      recitation: Number(row.avg_recitation) || 0,
    }));
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  async getClassAttendanceTrend(
    schoolId: string,
    classId: string,
    dateRange: DateRange,
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

  /** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
  async getStudentsNeedingAttention(
    classId: string,
    dateRange: DateRange,
  ): Promise<StudentNeedingAttention[]> {
    const { data, error } = await supabase.rpc('get_students_needing_attention', {
      p_class_id: classId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      studentId: row.student_id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      currentAvg: Number(row.current_avg) || 0,
      previousAvg: Number(row.previous_avg) || 0,
      declineAmount: Number(row.decline_amount) || 0,
      flagReason: row.flag_reason as 'declining' | 'low_scores',
    }));
  }

  async getTeacherClasses(
    teacherId: string,
  ): Promise<Array<{ id: string; name: string; name_localized?: Record<string, string> | null }>> {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, name_localized')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data ?? []) as Array<{ id: string; name: string; name_localized?: Record<string, string> | null }>;
  }
}

export const teacherReportsService = new TeacherReportsService();
