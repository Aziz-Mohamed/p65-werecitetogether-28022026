import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '../services/enrollment.service';
import type { EnrollInput } from '../types';

export const useEnrollmentsByStudent = (studentId: string | undefined) =>
  useQuery({
    queryKey: ['enrollments', 'student', studentId],
    queryFn: async () => {
      const result = await enrollmentService.getEnrollmentsByStudent(studentId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!studentId,
    staleTime: 60_000,
  });

export const useEnrollmentsByCohort = (cohortId: string | undefined) =>
  useQuery({
    queryKey: ['enrollments', 'cohort', cohortId],
    queryFn: async () => {
      const result = await enrollmentService.getEnrollmentsByCohort(cohortId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!cohortId,
    staleTime: 60_000,
  });

export const usePendingEnrollmentsByCohort = (cohortId: string | undefined) =>
  useQuery({
    queryKey: ['enrollments', 'pending', cohortId],
    queryFn: async () => {
      const result = await enrollmentService.getPendingEnrollmentsByCohort(cohortId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!cohortId,
    staleTime: 30_000,
  });

export const useEnroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnrollInput) => {
      const result = await enrollmentService.enroll(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'student', variables.studentId] });
      if (variables.cohortId) {
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'cohort', variables.cohortId] });
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'pending', variables.cohortId] });
      }
    },
  });
};

export const useApproveEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const result = await enrollmentService.approveEnrollment(enrollmentId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};

export const useDropEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const result = await enrollmentService.dropEnrollment(enrollmentId);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};
