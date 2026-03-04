import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';

export function useCohortEnrollments(cohortId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'cohort', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID required');
      const { data, error } = await programsService.getCohortEnrollments(cohortId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cohortId,
  });
}

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateEnrollmentStatus'],
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: 'active' | 'dropped' }) =>
      programsService.updateEnrollmentStatus(enrollmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
