import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import type { CertificationInput } from '../types/gamification.types';

/**
 * Mutation hook to certify a new rubʿ for a student.
 * Invalidates rub-certifications and student-dashboard queries on success.
 */
export const useCertifyRub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['certify-rub'],
    mutationFn: (input: CertificationInput) =>
      gamificationService.certifyRub(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rub-certifications', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });
};
