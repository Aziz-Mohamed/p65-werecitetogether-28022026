import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import type { MilestoneBadge } from '../types/gamification.types';

/**
 * Fetch all milestone badge type definitions.
 * Stale for 1 hour since badge definitions rarely change.
 */
export const useMilestoneBadges = () => {
  return useQuery({
    queryKey: ['gamification', 'badges', 'all'],
    queryFn: async () => {
      const { data, error } = await gamificationService.getMilestoneBadges();
      if (error) throw error;
      return (data ?? []) as unknown as MilestoneBadge[];
    },
    staleTime: 1000 * 60 * 60,
  });
};
