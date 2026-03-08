import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { SessionTrendPoint, TeacherWorkloadEntry, EnrollmentStatusDistribution } from '../types/admin.types';

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function useProgramReports(programId: string | undefined) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12 weeks
  const startDateStr = startDate.toISOString();

  const sessionTrend = useQuery({
    queryKey: ['program-session-trend', programId],
    queryFn: async () => {
      const { data, error } = await adminService.getProgramSessionTrend(programId!, startDateStr);
      if (error) throw error;
      const weeks = new Map<string, number>();
      (data ?? []).forEach((row: { created_at: string }) => {
        const week = getWeekKey(new Date(row.created_at));
        weeks.set(week, (weeks.get(week) ?? 0) + 1);
      });
      return Array.from(weeks.entries())
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => a.week.localeCompare(b.week)) as SessionTrendPoint[];
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });

  const teacherWorkload = useQuery({
    queryKey: ['teacher-workload', programId],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await adminService.getTeacherWorkload(programId!);
      if (roleError) throw roleError;
      if (!roleData || roleData.length === 0) return [] as TeacherWorkloadEntry[];

      const teacherIds = roleData.map((r: { profile_id: string }) => r.profile_id);
      const { data: sessionData, error: sessionError } = await adminService.getTeacherSessionCounts(teacherIds, startDateStr);
      if (sessionError) throw sessionError;

      const counts = new Map<string, number>();
      (sessionData ?? []).forEach((s: { teacher_id: string }) => {
        counts.set(s.teacher_id, (counts.get(s.teacher_id) ?? 0) + 1);
      });

      return roleData.map((r: { profile_id: string; profiles: { full_name: string } | null }) => ({
        teacher_id: r.profile_id,
        full_name: r.profiles?.full_name ?? '-',
        session_count: counts.get(r.profile_id) ?? 0,
      })) as TeacherWorkloadEntry[];
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });

  return { sessionTrend, teacherWorkload };
}
