import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { SupervisorDashboardStats } from '../types/admin.types';

export function useSupervisorDashboard(supervisorId: string | undefined) {
  return useQuery({
    queryKey: ['supervisor-dashboard', supervisorId],
    queryFn: async () => {
      const { data, error } = await adminService.getSupervisorDashboardStats(supervisorId!);
      if (error) throw error;
      return data as unknown as SupervisorDashboardStats;
    },
    enabled: !!supervisorId,
    staleTime: 2 * 60 * 1000,
  });
}
