import { useQuery } from '@tanstack/react-query';
import { curriculumProgressService } from '../services/curriculum-progress.service';

export function useCompletionPercentage(enrollmentId?: string) {
  return useQuery({
    queryKey: ['progress-summary', enrollmentId],
    queryFn: async () => {
      const { data, error } = await curriculumProgressService.getProgressSummary(enrollmentId!);
      if (error) throw error;
      return data;
    },
    enabled: !!enrollmentId,
  });
}
