import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';

export const useLeaderboard = (
  classId: string | undefined,
) => {
  return useQuery({
    queryKey: ['leaderboard', classId],
    queryFn: async () => {
      if (!classId) throw new Error('Class ID is required');
      const { data, error } = await gamificationService.getLeaderboard(classId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classId,
  });
};
