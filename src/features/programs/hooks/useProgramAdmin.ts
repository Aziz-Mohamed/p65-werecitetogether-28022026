import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import { programRolesService } from '../services/program-roles.service';
import type { ProgramRoleWithProfile } from '../services/program-roles.service';

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      name_ar: string;
      description?: string;
      description_ar?: string;
      category: string;
      settings?: Record<string, unknown>;
    }) => {
      const result = await programsService.createProgram(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      name_ar?: string;
      description?: string;
      description_ar?: string;
      category?: string;
      is_active?: boolean;
      settings?: Record<string, unknown>;
    }) => {
      const result = await programsService.updateProgram(id, input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', id] });
    },
  });
};

export const useCreateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programId,
      ...input
    }: {
      programId: string;
      name: string;
      name_ar: string;
      description?: string;
      description_ar?: string;
      track_type?: string;
      curriculum?: Record<string, unknown>;
      sort_order?: number;
    }) => {
      const result = await programsService.createTrack(programId, input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, { programId }) => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['program-tracks', programId] });
    },
  });
};

export const useUpdateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      name_ar?: string;
      description?: string;
      description_ar?: string;
      track_type?: string;
      curriculum?: Record<string, unknown>;
      sort_order?: number;
      is_active?: boolean;
    }) => {
      const result = await programsService.updateTrack(id, input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program-tracks'] });
    },
  });
};

export const useRolesForProgram = (programId: string | undefined) =>
  useQuery({
    queryKey: ['program-roles', programId],
    queryFn: async () => {
      const result = await programRolesService.getRolesForProgram(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: 60_000,
  });
