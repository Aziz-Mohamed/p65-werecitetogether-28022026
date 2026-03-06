import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';
import type { SubmitRatingInput } from '../types/ratings.types';

export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitRatingInput) => ratingsService.submitRating(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rating-for-session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
