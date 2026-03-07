import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { ProgramClassFilters, ProgramClassWithTeacher } from '../types/programs.types';

export function useProgramClasses(filters: ProgramClassFilters) {
  return useQuery({
    queryKey: ['programs', filters.programId, 'classes', filters.trackId],
    queryFn: async () => {
      const { data, error } = await programsService.getProgramClasses(filters);
      if (error) throw error;
      return (data ?? []) as ProgramClassWithTeacher[];
    },
    enabled: !!filters.programId,
  });
}
