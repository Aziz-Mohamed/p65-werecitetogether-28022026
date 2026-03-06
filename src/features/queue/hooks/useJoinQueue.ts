import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';

export function useJoinQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (programId: string) => queueService.joinQueue(programId),
    onSuccess: (_data, programId) => {
      queryClient.invalidateQueries({ queryKey: ['queue-status', programId] });
    },
  });
}
