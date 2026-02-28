import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';
import type { CreateDraftSessionInput } from '../types';

export const useCreateDraftSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDraftSessionInput) => {
      const result = await sessionsService.createDraftSession(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sessions'],
      });
    },
  });
};
