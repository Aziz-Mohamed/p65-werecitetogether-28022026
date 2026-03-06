import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type {
  ProgramEnrollmentTrend,
  ProgramSessionVolume,
  TeacherActivityEntry,
} from '../types/admin.types';

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function useMasterAdminReports() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12 weeks
  const startDateStr = startDate.toISOString();

  const enrollmentTrend = useQuery({
    queryKey: ['enrollment-trend', startDateStr],
    queryFn: async () => {
      const { data, error } = await adminService.getCrossProgramEnrollmentTrend(startDateStr);
      if (error) throw error;
      const map = new Map<string, Map<string, number>>();
      (data ?? []).forEach((row: { program_id: string; enrolled_at: string }) => {
        const week = getWeekKey(new Date(row.enrolled_at));
        if (!map.has(week)) map.set(week, new Map());
        const wm = map.get(week)!;
        wm.set(row.program_id, (wm.get(row.program_id) ?? 0) + 1);
      });
      const result: ProgramEnrollmentTrend[] = [];
      map.forEach((programs, week) => {
        programs.forEach((count, programId) => {
          result.push({ week, program_id: programId, program_name: '', count });
        });
      });
      return result.sort((a, b) => a.week.localeCompare(b.week));
    },
    staleTime: 5 * 60 * 1000,
  });

  const sessionVolume = useQuery({
    queryKey: ['session-volume', startDateStr],
    queryFn: async () => {
      const { data, error } = await adminService.getCrossProgramSessionVolume(startDateStr);
      if (error) throw error;
      const map = new Map<string, Map<string, number>>();
      (data ?? []).forEach((row: { program_id: string; created_at: string }) => {
        const week = getWeekKey(new Date(row.created_at));
        if (!map.has(week)) map.set(week, new Map());
        const wm = map.get(week)!;
        wm.set(row.program_id ?? 'none', (wm.get(row.program_id ?? 'none') ?? 0) + 1);
      });
      const result: ProgramSessionVolume[] = [];
      map.forEach((programs, week) => {
        programs.forEach((count, programId) => {
          result.push({ week, program_id: programId, program_name: '', count });
        });
      });
      return result.sort((a, b) => a.week.localeCompare(b.week));
    },
    staleTime: 5 * 60 * 1000,
  });

  const teacherHeatmap = useQuery({
    queryKey: ['teacher-heatmap', startDateStr],
    queryFn: async () => {
      const { data, error } = await adminService.getTeacherActivityHeatmap(startDateStr);
      if (error) throw error;
      const map = new Map<string, Map<string, number>>();
      (data ?? []).forEach((row: { teacher_id: string; created_at: string }) => {
        const day = getDayKey(new Date(row.created_at));
        const key = `${row.teacher_id}-${day}`;
        if (!map.has(row.teacher_id)) map.set(row.teacher_id, new Map());
        const tm = map.get(row.teacher_id)!;
        tm.set(day, (tm.get(day) ?? 0) + 1);
      });
      const result: TeacherActivityEntry[] = [];
      map.forEach((days, teacherId) => {
        days.forEach((count, day) => {
          result.push({ teacher_id: teacherId, full_name: '', day, session_count: count });
        });
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { enrollmentTrend, sessionVolume, teacherHeatmap };
}
