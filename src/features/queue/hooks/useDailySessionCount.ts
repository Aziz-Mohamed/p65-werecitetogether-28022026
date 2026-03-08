import { useQuery } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';

export function useDailySessionCount(programId: string | undefined) {
  return useQuery({
    queryKey: ['daily-session-count', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required');
      return queueService.getDailySessionCount(programId);
    },
    enabled: !!programId,
  });
}
