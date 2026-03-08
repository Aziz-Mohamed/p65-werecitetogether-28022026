import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import type { RubReference } from '../types/gamification.types';

/**
 * Fetches the static 240-row Quran rubʿ reference data.
 * Cached with infinite staleTime since this data never changes.
 */
export const useRubReference = () => {
  return useQuery({
    queryKey: ['rub-reference'],
    queryFn: async () => {
      const { data, error } = await gamificationService.getRubReference();
      if (error) throw error;
      return (data ?? []) as RubReference[];
    },
    staleTime: Infinity,
  });
};
