import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cohortsService } from '../services/cohorts.service';
import type { CohortStatus, CreateCohortInput, UpdateCohortInput } from '../types';

export const useCohortsByProgram = (programId: string | undefined) =>
  useQuery({
    queryKey: ['cohorts', programId],
    queryFn: async () => {
      const result = await cohortsService.getCohortsByProgram(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: 60_000,
  });

export const useCohortById = (cohortId: string | undefined) =>
  useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      const result = await cohortsService.getCohortById(cohortId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!cohortId,
    staleTime: 60_000,
  });

export const useCreateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCohortInput) => {
      const result = await cohortsService.createCohort(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts', variables.programId] });
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCohortInput }) => {
      const result = await cohortsService.updateCohort(id, input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort', data.id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', data.program_id] });
    },
  });
};

export const useUpdateCohortStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CohortStatus }) => {
      const result = await cohortsService.updateCohortStatus(id, status);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort', data.id] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', data.program_id] });
    },
  });
};
