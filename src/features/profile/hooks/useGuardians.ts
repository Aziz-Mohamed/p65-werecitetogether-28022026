import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profile.service';

export function useStudentGuardians(studentId: string | undefined) {
  return useQuery({
    queryKey: ['guardians', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data, error } = await profileService.getStudentGuardians(studentId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
  });
}

export function useAddGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      studentId: string;
      guardianName: string;
      guardianPhone?: string;
      guardianEmail?: string;
      relationship?: string;
      isPrimary?: boolean;
    }) => profileService.addGuardian(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.studentId] });
    },
  });
}

export function useUpdateGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, studentId, input }: {
      id: string;
      studentId: string;
      input: {
        guardianName?: string;
        guardianPhone?: string | null;
        guardianEmail?: string | null;
        relationship?: string;
        isPrimary?: boolean;
      };
    }) => profileService.updateGuardian(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', variables.studentId] });
    },
  });
}

export function useDeleteGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) =>
      profileService.deleteGuardian(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.studentId] });
    },
  });
}
