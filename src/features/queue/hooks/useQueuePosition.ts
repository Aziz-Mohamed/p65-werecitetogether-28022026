import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';
import { supabase } from '@/lib/supabase';

export function useQueuePosition(programId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['queue-status', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required');
      return queueService.getQueueStatus(programId);
    },
    enabled: !!programId,
    refetchInterval: 30_000,
  });

  // Subscribe to Realtime changes on program_queue_entries for live position updates
  useEffect(() => {
    if (!programId) return;

    const channel = supabase
      .channel(`queue-position-${programId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'program_queue_entries',
          filter: `program_id=eq.${programId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue-status', programId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [programId, queryClient]);

  return query;
}
