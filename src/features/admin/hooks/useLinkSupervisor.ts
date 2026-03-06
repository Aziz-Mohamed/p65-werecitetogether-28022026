import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { LinkSupervisorInput } from '../types/admin.types';

export function useLinkSupervisor(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LinkSupervisorInput) =>
      adminService.linkSupervisorToTeacher(input.programRoleId, input.supervisorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-team', programId] });
    },
  });
}
