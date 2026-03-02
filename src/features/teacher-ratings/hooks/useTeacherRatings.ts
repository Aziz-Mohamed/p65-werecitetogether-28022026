import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherRatingsService } from '../services/teacher-ratings.service';
import type { SubmitReviewInput } from '../types';

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const result = await teacherRatingsService.submitReview(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rating-stats', variables.teacherId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.teacherId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['can-review', variables.studentId, variables.sessionId],
      });
    },
  });
};

export const useRatingStats = (
  teacherId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['rating-stats', teacherId, programId],
    queryFn: async () => {
      const result = await teacherRatingsService.getRatingStats(teacherId!, programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!teacherId && !!programId,
    staleTime: 120_000,
  });

export const useCanStudentReview = (
  studentId: string | undefined,
  sessionId: string | undefined,
) =>
  useQuery({
    queryKey: ['can-review', studentId, sessionId],
    queryFn: async () => {
      const result = await teacherRatingsService.canStudentReview(studentId!, sessionId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!studentId && !!sessionId,
    staleTime: 60_000,
  });

export const useReviewsForTeacher = (
  teacherId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['reviews', teacherId, programId],
    queryFn: async () => {
      const result = await teacherRatingsService.getReviewsForTeacher(teacherId!, programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!teacherId && !!programId,
    staleTime: 120_000,
  });
