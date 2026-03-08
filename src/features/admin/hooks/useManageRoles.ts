import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import { programsService } from '@/features/programs/services/programs.service';
import type { AssignRoleInput } from '@/features/programs/types/programs.types';

export function useManageRoles() {
  const queryClient = useQueryClient();

  const assignProgramRole = useMutation({
    mutationFn: ({ input, assignedBy }: { input: AssignRoleInput; assignedBy: string }) =>
      programsService.assignProgramRole(input, assignedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['program-team'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
  });

  const removeProgramRole = useMutation({
    mutationFn: (roleId: string) => programsService.removeProgramRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['program-team'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
  });

  const assignMasterAdmin = useMutation({
    mutationFn: ({ userId, assignedBy }: { userId: string; assignedBy: string }) =>
      adminService.assignMasterAdminRole({ p_user_id: userId, p_assigned_by: assignedBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
  });

  const revokeMasterAdmin = useMutation({
    mutationFn: (userId: string) =>
      adminService.revokeMasterAdminRole({ p_user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
  });

  return { assignProgramRole, removeProgramRole, assignMasterAdmin, revokeMasterAdmin };
}
