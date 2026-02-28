import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAvailabilityService } from '../services/teacher-availability.service';

export const useAvailableTeachers = (programId: string | undefined) =>
  useQuery({
    queryKey: ['teacher-availability', programId],
    queryFn: async () => {
      const result = await teacherAvailabilityService.getAvailableTeachers(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

export const useToggleAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      programId,
      isAvailable,
    }: {
      programId: string;
      isAvailable: boolean;
    }) => {
      const result = await teacherAvailabilityService.toggleAvailability(
        programId,
        isAvailable,
      );
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, { programId }) => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', programId],
      });
    },
  });
};
