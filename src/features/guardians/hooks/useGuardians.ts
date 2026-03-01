import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardiansService } from '../services/guardians.service';
import type { AddGuardianInput, UpdateGuardianInput } from '../types/guardians.types';

export function useGuardians(studentId?: string) {
  return useQuery({
    queryKey: ['guardians', studentId],
    queryFn: async () => {
      const { data, error } = await guardiansService.getGuardians(studentId!);
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

export function useAddGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddGuardianInput) => {
      const { data, error } = await guardiansService.addGuardian(input);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', variables.student_id] });
    },
  });
}

export function useUpdateGuardian(studentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guardianId, input }: { guardianId: string; input: UpdateGuardianInput }) => {
      const { data, error } = await guardiansService.updateGuardian(guardianId, input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians', studentId] });
    },
  });
}

export function useRemoveGuardian(studentId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guardianId: string) => {
      const { error } = await guardiansService.removeGuardian(guardianId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians', studentId] });
    },
  });
}
