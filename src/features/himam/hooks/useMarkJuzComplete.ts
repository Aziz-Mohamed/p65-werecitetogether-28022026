import { useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { HimamProgress, MarkJuzCompleteInput } from '../types/himam.types';

export function useMarkJuzComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['himam', 'markComplete'],
    mutationFn: (input: MarkJuzCompleteInput) => himamService.markComplete(input),
    onMutate: async (input) => {
      const queryKey = ['himam', 'progress', input.registrationId];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<HimamProgress[]>(queryKey);

      queryClient.setQueryData<HimamProgress[]>(queryKey, (old) =>
        old?.map((p) =>
          p.juz_number === input.juzNumber
            ? { ...p, status: 'completed' as const, completed_at: new Date().toISOString() }
            : p,
        ),
      );

      return { previous, queryKey };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['himam'] });
    },
  });
}
