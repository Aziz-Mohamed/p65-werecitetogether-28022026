import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { CohortFilters, CohortWithTeacher } from '../types/programs.types';

export function useCohorts(filters: CohortFilters) {
  return useQuery({
    queryKey: ['programs', filters.programId, 'cohorts', filters.trackId],
    queryFn: async () => {
      const { data, error } = await programsService.getCohorts(filters);
      if (error) throw error;
      return (data ?? []) as CohortWithTeacher[];
    },
    enabled: !!filters.programId,
  });
}
