import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { AdminUserProgramRole } from '../types/admin.types';

export function useUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => {
      const [profileResult, rolesResult] = await Promise.all([
        adminService.getUserDetail(id!),
        adminService.getUserProgramRoles(id!),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const program_roles_data: AdminUserProgramRole[] = (rolesResult.data ?? []).map(
        (row: any) => ({
          role_id: row.id,
          program_id: row.program_id,
          program_name: row.programs.name,
          role: row.role,
        }),
      );

      return { ...profileResult.data, program_roles_data };
    },
    enabled: !!id,
  });
}
