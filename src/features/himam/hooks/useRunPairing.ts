import { useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';

export function useRunPairing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['himam', 'runPairing'],
    mutationFn: (eventId: string) => himamService.runPairing(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam'] });
    },
  });
}
