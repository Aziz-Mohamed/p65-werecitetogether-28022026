import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { ResubmitInput } from '../types/certifications.types';

export function useResubmitCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certifications', 'resubmit'],
    mutationFn: (input: ResubmitInput) => certificationsService.resubmit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
