import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '@/features/programs/services/programs.service';
import type { ProgramSettingsInput } from '../types/admin.types';

export function useProgramSettings(programId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: ProgramSettingsInput) =>
      programsService.updateProgram(programId!, { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['program-admin-dashboard', programId] });
    },
  });
}
