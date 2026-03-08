import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { RecommendInput } from '../types/certifications.types';

export function useRecommendCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certifications', 'recommend'],
    mutationFn: (input: RecommendInput) => certificationsService.recommend(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
