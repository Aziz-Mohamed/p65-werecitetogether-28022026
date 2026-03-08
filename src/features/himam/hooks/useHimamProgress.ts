import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { HimamProgress } from '../types/himam.types';

export function useHimamProgress(registrationId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'progress', registrationId],
    queryFn: async () => {
      if (!registrationId) return [];
      const { data, error } = await himamService.getProgress(registrationId);
      if (error) throw error;
      return (data ?? []) as HimamProgress[];
    },
    enabled: !!registrationId,
  });
}
