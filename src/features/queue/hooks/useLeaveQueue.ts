import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';

export function useLeaveQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (programId: string) => queueService.leaveQueue(programId),
    onSuccess: (_data, programId) => {
      queryClient.invalidateQueries({ queryKey: ['queue-status', programId] });
    },
  });
}
