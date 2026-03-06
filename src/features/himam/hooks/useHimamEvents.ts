import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { HimamEvent } from '../types/himam.types';

export function useHimamEvents(programId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'events', programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await himamService.getEvents(programId);
      if (error) throw error;
      return (data ?? []) as HimamEvent[];
    },
    enabled: !!programId,
  });
}
