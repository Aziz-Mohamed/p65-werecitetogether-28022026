import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { ProgramAdminDashboardStats } from '../types/admin.types';

export function useProgramAdminDashboard(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-admin-dashboard', programId],
    queryFn: async () => {
      const { data, error } = await adminService.getProgramAdminDashboardStats(programId!);
      if (error) throw error;
      return data as unknown as ProgramAdminDashboardStats;
    },
    enabled: !!programId,
    staleTime: 2 * 60 * 1000,
  });
}
