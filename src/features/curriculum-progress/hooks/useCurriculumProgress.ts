import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculumProgressService } from '../services/curriculum-progress.service';
import type { UpdateSectionInput, BatchUpdateItem } from '../types/curriculum-progress.types';

export function useCurriculumProgress(enrollmentId?: string) {
  return useQuery({
    queryKey: ['curriculum-progress', enrollmentId],
    queryFn: async () => {
      const { data, error } = await curriculumProgressService.getProgressByEnrollment(enrollmentId!);
      if (error) throw error;
      return data;
    },
    enabled: !!enrollmentId,
  });
}

export function useUpdateSectionProgress(enrollmentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ progressId, input }: { progressId: string; input: UpdateSectionInput }) => {
      const { data, error } = await curriculumProgressService.updateSectionProgress(progressId, input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['progress-summary', enrollmentId] });
    },
  });
}

export function useBatchUpdateSections(enrollmentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: BatchUpdateItem[]) => {
      const { data, error } = await curriculumProgressService.batchUpdateSections(updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress', enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['progress-summary', enrollmentId] });
    },
  });
}

export function useInitializeProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      trackId,
      progressType,
      studentId,
      programId,
    }: {
      enrollmentId: string;
      trackId: string;
      progressType: string;
      studentId: string;
      programId: string;
    }) => {
      const { data, error } = await curriculumProgressService.initializeProgress(
        enrollmentId,
        trackId,
        progressType,
        studentId,
        programId,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress', variables.enrollmentId] });
    },
  });
}
