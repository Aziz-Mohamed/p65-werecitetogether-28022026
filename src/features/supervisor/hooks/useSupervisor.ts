import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supervisorService } from '../services/supervisor.service';

export const useAssignedTeachers = (
  supervisorId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['assigned-teachers', supervisorId, programId],
    queryFn: async () => {
      const result = await supervisorService.getAssignedTeachers(
        supervisorId!,
        programId!,
      );
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!supervisorId && !!programId,
    staleTime: 60_000,
  });

export const useFlaggedReviews = (programId: string | undefined) =>
  useQuery({
    queryKey: ['flagged-reviews', programId],
    queryFn: async () => {
      const result = await supervisorService.getFlaggedReviews(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: 60_000,
  });

export const useReassignStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      newTeacherId,
    }: {
      enrollmentId: string;
      newTeacherId: string;
      supervisorId: string;
      programId: string;
    }) => {
      const result = await supervisorService.reassignStudent(
        enrollmentId,
        newTeacherId,
      );
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assigned-teachers', variables.supervisorId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['enrollments'],
      });
    },
  });
};
