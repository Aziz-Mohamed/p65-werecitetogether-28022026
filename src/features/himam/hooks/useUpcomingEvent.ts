import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { HimamEvent } from '../types/himam.types';

export function useUpcomingEvent(programId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'upcoming', programId],
    queryFn: async () => {
      if (!programId) return null;
      const { data, error } = await himamService.getUpcomingEvent(programId);
      if (error) throw error;
      return (data ?? null) as HimamEvent | null;
    },
    enabled: !!programId,
  });
}
