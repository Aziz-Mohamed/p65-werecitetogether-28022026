import { useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['himam', 'cancel'],
    mutationFn: (registrationId: string) => himamService.cancel(registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam'] });
    },
  });
}
