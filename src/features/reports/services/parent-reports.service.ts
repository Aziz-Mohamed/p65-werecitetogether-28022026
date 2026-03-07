import { supabase } from '@/lib/supabase';
import type {
  DateRange,
  ChildProgressReport,
  ChildScoreTrendPoint,
  ChildAttendanceSummary,
  ChildGamificationSummary,
} from '../types/reports.types';

class ParentReportsService {
  async getChildProgressReport(
    studentId: string,
    classId: string | null,
    dateRange: DateRange,
  ): Promise<ChildProgressReport> {
    const [scoreTrend, attendanceSummary, gamification] = await Promise.all([
      classId
        ? this.getChildScoreTrend(studentId, classId, dateRange)
        : this.getChildScoreTrendNoClass(studentId, dateRange),
      this.getChildAttendanceSummary(studentId, dateRange),
      this.getChildGamificationSummary(studentId),
    ]);

    return { scoreTrend, attendanceSummary, gamification };
  }

  async getChildScoreTrend(
    studentId: string,
    classId: string,
    dateRange: DateRange,
  ): Promise<ChildScoreTrendPoint[]> {
    const { data, error } = await supabase.rpc('get_child_score_trend', {
      p_student_id: studentId,
      p_class_id: classId,
      p_start_date: dateRange.startDate,
      p_end_date: dateRange.endDate,
      p_granularity: dateRange.granularity,
    });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.bucket_date,
      memorization: Number(row.avg_memorization) || 0,
      tajweed: Number(row.avg_tajweed) || 0,
      recitation: Number(row.avg_recitation) || 0,
      classAvgMemorization: Number(row.class_avg_memorization) || 0,
      classAvgTajweed: Number(row.class_avg_tajweed) || 0,
      classAvgRecitation: Number(row.class_avg_recitation) || 0,
    }));
  }

  /** Fallback when child has no class — no class averages */
  private async getChildScoreTrendNoClass(
    studentId: string,
    dateRange: DateRange,
  ): Promise<ChildScoreTrendPoint[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('session_date, memorization_score, tajweed_score, recitation_quality')
      .eq('student_id', studentId)
      .gte('session_date', dateRange.startDate)
      .lte('session_date', dateRange.endDate)
      .order('session_date');

    if (error) throw error;

    return (data ?? []).map((row) => ({
      date: row.session_date,
      memorization: row.memorization_score ?? 0,
      tajweed: row.tajweed_score ?? 0,
      recitation: row.recitation_quality ?? 0,
      classAvgMemorization: 0,
      classAvgTajweed: 0,
      classAvgRecitation: 0,
    }));
  }

  async getChildAttendanceSummary(
    studentId: string,
    dateRange: DateRange,
  ): Promise<ChildAttendanceSummary> {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    if (error) throw error;

    const records = data ?? [];
    const presentDays = records.filter((r) => r.status === 'present').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const excusedDays = records.filter((r) => r.status === 'excused').length;
    const totalDays = records.length;

    // Rate formula: (present + late) / (present + absent + late) * 100
    // Edge Case 12: "N/A" when denominator is zero — represented as -1 in numeric
    const denom = presentDays + absentDays + lateDays;
    const rate = denom > 0 ? Math.round(((presentDays + lateDays) / denom) * 100 * 10) / 10 : -1;

    return { totalDays, presentDays, absentDays, lateDays, excusedDays, rate };
  }

  async getChildGamificationSummary(
    studentId: string,
  ): Promise<ChildGamificationSummary> {
    const [studentData, stickerCount, certCount] = await Promise.all([
      supabase
        .from('students')
        .select('current_level, current_streak, longest_streak')
        .eq('id', studentId)
        .single(),
      supabase
        .from('student_stickers')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId),
      supabase
        .from('student_rub_certifications')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .is('dormant_since', null),
    ]);

    if (studentData.error) throw studentData.error;

    const student = studentData.data;

    return {
      totalStickers: stickerCount.count ?? 0,
      currentLevel: student.current_level ?? 0,
      currentStreak: student.current_streak,
      longestStreak: student.longest_streak,
      activeCertifications: certCount.count ?? 0,
    };
  }
}

export const parentReportsService = new ParentReportsService();
