import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';
import type { ExcludeRatingInput, RestoreRatingInput } from '../types/ratings.types';

export function useExcludeRating() {
  const queryClient = useQueryClient();

  const exclude = useMutation({
    mutationFn: (input: ExcludeRatingInput) => ratingsService.excludeRating(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-rating-stats'] });
    },
  });

  const restore = useMutation({
    mutationFn: (input: RestoreRatingInput) => ratingsService.restoreRating(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-rating-stats'] });
    },
  });

  return { exclude, restore };
}
