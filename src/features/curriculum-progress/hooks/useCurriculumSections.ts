import { useQuery } from '@tanstack/react-query';
import { curriculumProgressService } from '../services/curriculum-progress.service';

export function useCurriculumSections(trackId?: string) {
  return useQuery({
    queryKey: ['curriculum-sections', trackId],
    queryFn: async () => {
      const { data, error } = await curriculumProgressService.getCurriculumSections(trackId!);
      if (error) throw error;
      return data;
    },
    enabled: !!trackId,
  });
}
