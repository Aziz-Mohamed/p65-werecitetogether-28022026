import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { Program } from '../types/programs.types';

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await programsService.getPrograms();
      if (error) throw error;
      return (data ?? []) as Program[];
    },
  });
}
