import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { MasterAdminProgramEnriched } from '../types/admin.types';

export function useMasterAdminPrograms() {
  return useQuery({
    queryKey: ['master-admin-programs'],
    queryFn: async () => {
      const { data, error } = await adminService.getMasterAdminProgramsEnriched();
      if (error) throw error;
      return (data as unknown as MasterAdminProgramEnriched[]) ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
