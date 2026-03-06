import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { MasterAdminDashboardStats } from '../types/admin.types';

export function useMasterAdminDashboard() {
  return useQuery({
    queryKey: ['master-admin-dashboard'],
    queryFn: async () => {
      const { data, error } = await adminService.getMasterAdminDashboardStats();
      if (error) throw error;
      return data as unknown as MasterAdminDashboardStats;
    },
    staleTime: 2 * 60 * 1000,
  });
}
