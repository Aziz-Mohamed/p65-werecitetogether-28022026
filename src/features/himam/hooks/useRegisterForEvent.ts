import { useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { RegisterInput } from '../types/himam.types';

export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['himam', 'register'],
    mutationFn: (input: RegisterInput) => himamService.register(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam'] });
    },
  });
}
