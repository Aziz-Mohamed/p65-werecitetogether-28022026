import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { ProgramWithTracks } from '../types/programs.types';

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      if (!id) throw new Error('Program ID is required');
      const { data, error } = await programsService.getProgram(id);
      if (error) throw error;
      return data as ProgramWithTracks;
    },
    enabled: !!id,
  });
}
