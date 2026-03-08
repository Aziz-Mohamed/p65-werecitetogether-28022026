import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';

/**
 * Mutation hook to undo a certification (grace period delete).
 * Invalidates rub-certifications and student-dashboard queries on success.
 */
export const useUndoCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['undo-certification'],
    mutationFn: (input: { certificationId: string; studentId: string }) =>
      gamificationService.undoCertification(input.certificationId),
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
