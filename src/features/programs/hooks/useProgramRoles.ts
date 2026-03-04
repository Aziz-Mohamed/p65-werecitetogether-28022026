import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { AssignRoleInput, ProgramRoleWithProfile } from '../types/programs.types';

export function useProgramRoles(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-roles', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required');
      const { data, error } = await programsService.getProgramRoles(programId);
      if (error) throw error;
      return (data ?? []) as ProgramRoleWithProfile[];
    },
    enabled: !!programId,
  });
}

export function useAssignProgramRole(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['assignRole', programId],
    mutationFn: ({ input, assignedBy }: { input: AssignRoleInput; assignedBy: string }) =>
      programsService.assignProgramRole(input, assignedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-roles', programId] });
    },
  });
}

export function useRemoveProgramRole(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['removeRole', programId],
    mutationFn: (roleId: string) => programsService.removeProgramRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-roles', programId] });
    },
  });
}
