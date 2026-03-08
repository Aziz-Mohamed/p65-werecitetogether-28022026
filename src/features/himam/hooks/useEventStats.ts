import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { EventStats } from '../types/himam.types';

export function useEventStats(eventId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'stats', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await himamService.getStats(eventId);
      if (error) throw error;
      return (data ?? null) as EventStats | null;
    },
    enabled: !!eventId,
  });
}
