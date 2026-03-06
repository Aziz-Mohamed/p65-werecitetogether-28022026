import { useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';

export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['himam', 'cancelEvent'],
    mutationFn: (eventId: string) => himamService.cancelEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam'] });
    },
  });
}
