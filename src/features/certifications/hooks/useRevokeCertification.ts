import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { RevokeInput } from '../types/certifications.types';

export function useRevokeCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certifications', 'revoke'],
    mutationFn: (input: RevokeInput) => certificationsService.revoke(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
