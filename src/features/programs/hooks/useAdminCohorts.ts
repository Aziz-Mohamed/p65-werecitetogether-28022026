import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { CreateCohortInput } from '../types/programs.types';

export function useCreateCohort(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createCohort', programId],
    mutationFn: (input: CreateCohortInput) => programsService.createCohort(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'cohorts'] });
    },
  });
}

export function useUpdateCohortStatus(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateCohortStatus', programId],
    mutationFn: ({ cohortId, status }: { cohortId: string; status: string }) =>
      programsService.updateCohortStatus(cohortId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'cohorts'] });
    },
  });
}

export function useBulkApproveEnrollments(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['bulkApprove', programId],
    mutationFn: (cohortId: string) => programsService.bulkApproveEnrollments(cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'cohorts'] });
    },
  });
}
