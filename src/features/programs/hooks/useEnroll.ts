import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import { getEnrollErrorKey } from '../utils/enrollment-helpers';
import type { EnrollInput } from '../types/programs.types';

export function useEnroll(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['enroll', programId],
    mutationFn: (input: EnrollInput) => programsService.enrollStructured(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'cohorts'] });
    },
    onError: (error: { code?: string; message?: string }) => {
      // Error code → i18n key mapping is handled by getEnrollErrorKey()
      // Components should use getEnrollErrorKey(error.message) for display
    },
  });
}

export function useJoinFreeProgram(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['joinFree', programId],
    mutationFn: ({ userId, trackId }: { userId: string; trackId?: string }) =>
      programsService.joinFreeProgram(userId, programId, trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
