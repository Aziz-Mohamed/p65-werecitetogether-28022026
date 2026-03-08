import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import { programsService } from '@/features/programs/services/programs.service';
import type { ProgramTeamMember } from '../types/admin.types';
import type { AssignRoleInput } from '@/features/programs/types/programs.types';

export function useProgramTeam(programId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['program-team', programId],
    queryFn: async () => {
      const { data, error } = await adminService.getProgramTeam(programId!);
      if (error) throw error;
      return (data as unknown as ProgramTeamMember[]) ?? [];
    },
    enabled: !!programId,
  });

  const assign = useMutation({
    mutationFn: ({ input, assignedBy }: { input: AssignRoleInput; assignedBy: string }) =>
      programsService.assignProgramRole(input, assignedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-team', programId] });
    },
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => programsService.removeProgramRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-team', programId] });
    },
  });

  return { ...query, assign, remove };
}
