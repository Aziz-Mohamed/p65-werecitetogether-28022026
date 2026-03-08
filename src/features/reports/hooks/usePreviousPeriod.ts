import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DateRange } from '../types/reports.types';

const STALE_TIME = 5 * 60 * 1000;

interface PeriodComparisonResult {
  currentAttendanceRate: number;
  previousAttendanceRate: number;
  currentAvgMemorization: number;
  currentAvgTajweed: number;
  currentAvgRecitation: number;
  previousAvgMemorization: number;
  previousAvgTajweed: number;
  previousAvgRecitation: number;
  currentStickers: number;
  previousStickers: number;
}

/**
 * Computes the equivalent previous period for a given date range.
 * E.g., "this week" → "last week"; "this month" → "last month".
 */
export function getPreviousDateRange(dateRange: DateRange): { start: string; end: string } {
  const currentStart = new Date(dateRange.startDate);
  const currentEnd = new Date(dateRange.endDate);
  const durationMs = currentEnd.getTime() - currentStart.getTime();

  const previousEnd = new Date(currentStart.getTime() - 86_400_000); // day before current start
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start: formatDate(previousStart),
    end: formatDate(previousEnd),
  };
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function usePeriodComparison(
  schoolId: string | null,
  dateRange: DateRange,
  classId?: string | null,
) {
  const previousRange = useMemo(() => getPreviousDateRange(dateRange), [dateRange]);

  return useQuery({
    queryKey: [
      'period-comparison',
      schoolId,
      dateRange.startDate,
      dateRange.endDate,
      previousRange.start,
      previousRange.end,
      classId,
    ],
    queryFn: async (): Promise<PeriodComparisonResult> => {
      const { data, error } = await supabase.rpc('get_period_comparison' as any, {
        p_school_id: schoolId!,
        p_current_start: dateRange.startDate,
        p_current_end: dateRange.endDate,
        p_previous_start: previousRange.start,
        p_previous_end: previousRange.end,
        p_class_id: classId ?? undefined,
      });

      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;

      return {
        currentAttendanceRate: Number(row?.current_attendance_rate) || 0,
        previousAttendanceRate: Number(row?.previous_attendance_rate) || 0,
        currentAvgMemorization: Number(row?.current_avg_memorization) || 0,
        currentAvgTajweed: Number(row?.current_avg_tajweed) || 0,
        currentAvgRecitation: Number(row?.current_avg_recitation) || 0,
        previousAvgMemorization: Number(row?.previous_avg_memorization) || 0,
        previousAvgTajweed: Number(row?.previous_avg_tajweed) || 0,
        previousAvgRecitation: Number(row?.previous_avg_recitation) || 0,
        currentStickers: Number(row?.current_stickers) || 0,
        previousStickers: Number(row?.previous_stickers) || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: STALE_TIME,
  });
}
