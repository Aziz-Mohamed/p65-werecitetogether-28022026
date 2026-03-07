import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { Program, UpdateProgramInput, CreateTrackInput } from '../types/programs.types';

/** All programs (master_admin — no is_active filter) */
export function useAllPrograms() {
  return useQuery({
    queryKey: ['programs', 'admin'],
    queryFn: async () => {
      const { data, error } = await programsService.getAllPrograms();
      if (error) throw error;
      return (data ?? []) as Program[];
    },
  });
}

/** Update program mutation */
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateProgram'],
    mutationFn: ({ programId, input }: { programId: string; input: UpdateProgramInput }) =>
      programsService.updateProgram(programId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

/** Create program mutation (master_admin only) */
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createProgram'],
    mutationFn: (input: UpdateProgramInput) => programsService.createProgram(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

/** Create track mutation */
export function useCreateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createTrack'],
    mutationFn: (input: CreateTrackInput) => programsService.createTrack(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
    },
  });
}

export function useUpdateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateTrack'],
    mutationFn: (args: { trackId: string; input: Parameters<typeof programsService.updateTrack>[1] }) =>
      programsService.updateTrack(args.trackId, args.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
    },
  });
}
