import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { IssueInput } from '../types/certifications.types';

export function useIssueCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certifications', 'issue'],
    mutationFn: (input: IssueInput) => certificationsService.issue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
