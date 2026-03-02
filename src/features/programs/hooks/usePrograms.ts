import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const usePrograms = () =>
  useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const result = await programsService.getPrograms();
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

export const useProgramById = (id: string | undefined) =>
  useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      const result = await programsService.getProgramById(id!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!id,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

export const useProgramTracks = (programId: string | undefined) =>
  useQuery({
    queryKey: ['programs', programId, 'tracks'],
    queryFn: async () => {
      const result = await programsService.getProgramTracks(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
