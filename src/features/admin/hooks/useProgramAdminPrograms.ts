import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { ProgramAdminProgram } from '../types/admin.types';

export function useProgramAdminPrograms(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-admin-programs', userId],
    queryFn: async () => {
      const { data, error } = await adminService.getMyProgramAdminPrograms(userId!);
      if (error) throw error;
      return (data as unknown as ProgramAdminProgram[]) ?? [];
    },
    enabled: !!userId,
  });
}
