import { useQuery } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';

/**
 * Checks if a session is ratable: completed, < 48h, not yet rated by current user.
 */
export function useRatingPrompt(sessionId: string | undefined, sessionStatus?: string, sessionCreatedAt?: string) {
  const { data: existingRating, isLoading } = useQuery({
    queryKey: ['rating-for-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await ratingsService.getRatingForSession(sessionId);
      return data;
    },
    enabled: !!sessionId && sessionStatus === 'completed',
  });

  const isCompleted = sessionStatus === 'completed';
  const isWithinWindow = sessionCreatedAt
    ? Date.now() - new Date(sessionCreatedAt).getTime() < 48 * 60 * 60 * 1000
    : false;
  const alreadyRated = !!existingRating;

  return {
    canRate: isCompleted && isWithinWindow && !alreadyRated && !isLoading,
    alreadyRated,
    isLoading,
    existingRating,
  };
}
