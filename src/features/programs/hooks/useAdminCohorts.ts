import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { CreateProgramClassInput } from '../types/programs.types';

export function useCreateProgramClass(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createProgramClass', programId],
    mutationFn: (input: CreateProgramClassInput) => programsService.createProgramClass(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'classes'] });
    },
  });
}

export function useUpdateClassStatus(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateClassStatus', programId],
    mutationFn: ({ classId, status }: { classId: string; status: string }) =>
      programsService.updateClassStatus(classId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'classes'] });
    },
  });
}

export function useBulkApproveEnrollments(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['bulkApprove', programId],
    mutationFn: (classId: string) => programsService.bulkApproveEnrollments(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'classes'] });
    },
  });
}
