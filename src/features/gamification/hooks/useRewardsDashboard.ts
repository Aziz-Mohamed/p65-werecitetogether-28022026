import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import type { RewardsDashboard } from '../types/gamification.types';

/**
 * Fetch the rewards dashboard aggregations for a program.
 * Used by supervisors and program admins.
 */
export const useRewardsDashboard = (programId: string | undefined) => {
  return useQuery({
    queryKey: ['gamification', 'rewards', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID is required');
      const { data, error } = await gamificationService.getRewardsDashboard(programId);
      if (error) throw error;
      return data as unknown as RewardsDashboard;
    },
    enabled: !!programId,
    staleTime: 1000 * 60 * 5,
  });
};
