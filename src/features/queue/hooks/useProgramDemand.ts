import { useQuery } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';

export function useProgramDemand(programId: string | undefined) {
  return useQuery({
    queryKey: ['program-demand', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required');
      return queueService.getProgramDemand(programId);
    },
    enabled: !!programId,
    refetchInterval: 60_000,
  });
}
