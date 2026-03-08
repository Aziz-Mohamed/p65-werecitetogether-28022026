import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { ReviewInput } from '../types/certifications.types';

export function useReviewCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certifications', 'review'],
    mutationFn: (input: ReviewInput) => certificationsService.review(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
