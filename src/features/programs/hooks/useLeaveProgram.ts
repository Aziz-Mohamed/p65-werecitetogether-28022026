import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';

export function useLeaveProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['leaveProgram'],
    mutationFn: ({ enrollmentId, userId }: { enrollmentId: string; userId: string }) =>
      programsService.leaveProgram(enrollmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
