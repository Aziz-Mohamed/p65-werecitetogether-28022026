import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';

/**
 * Hook for fetching Juz' progress for a registration.
 */
export function useHimamProgress(registrationId: string | undefined) {
  return useQuery({
    queryKey: ['himam-progress', registrationId],
    queryFn: async () => {
      const { data, error } = await himamService.getProgress(registrationId!);
      if (error) throw error;
      return data;
    },
    enabled: !!registrationId,
  });
}

/**
 * Mutation hook for logging a block completion.
 */
export function useLogBlockCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      juzNumber,
      loggedBy,
      status,
      notes,
    }: {
      registrationId: string;
      juzNumber: number;
      loggedBy: string;
      status: 'completed' | 'partner_absent';
      notes?: string;
    }) =>
      himamService.logBlockCompletion(
        registrationId,
        juzNumber,
        loggedBy,
        status,
        notes,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['himam-progress', variables.registrationId],
      });
      queryClient.invalidateQueries({ queryKey: ['himam-registration'] });
    },
  });
}
