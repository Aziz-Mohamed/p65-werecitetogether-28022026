import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mutoonService } from '../services/mutoon.service';
import type {
  MutoonProgressWithTrack,
  MutoonProgressWithStudent,
  UpdateMutoonProgressInput,
} from '../types/mutoon.types';

/** Fetch student's mutoon progress for a program */
export function useMyMutoonProgress(programId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['mutoon', 'progress', programId, userId],
    queryFn: async () => {
      if (!programId || !userId) throw new Error('Program ID and User ID required');
      const { data, error } = await mutoonService.getMyProgress(programId, userId);
      if (error) throw error;
      return (data ?? []) as MutoonProgressWithTrack[];
    },
    enabled: !!programId && !!userId,
  });
}

/** Fetch all students' progress for a track (teacher view) */
export function useTrackMutoonProgress(trackId: string | undefined) {
  return useQuery({
    queryKey: ['mutoon', 'track', trackId],
    queryFn: async () => {
      if (!trackId) throw new Error('Track ID required');
      const { data, error } = await mutoonService.getTrackProgress(trackId);
      if (error) throw error;
      return (data ?? []) as MutoonProgressWithStudent[];
    },
    enabled: !!trackId,
  });
}

/** Initialize mutoon progress for a student on a track */
export function useInitMutoonProgress(programId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { studentId: string; trackId: string; totalLines: number }) =>
      mutoonService.initProgress(input.studentId, programId, input.trackId, input.totalLines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutoon'] });
    },
  });
}

/** Update mutoon progress (advance line position) */
export function useUpdateMutoonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { progressId: string } & UpdateMutoonProgressInput) =>
      mutoonService.updateProgress(input.progressId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutoon'] });
    },
  });
}

/** Certify a completed mutoon */
export function useCertifyMutoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { progressId: string; certifiedBy: string }) =>
      mutoonService.certifyProgress(input.progressId, input.certifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutoon'] });
    },
  });
}

/** Record a review session */
export function useRecordMutoonReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (progressId: string) => mutoonService.recordReview(progressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutoon'] });
    },
  });
}
