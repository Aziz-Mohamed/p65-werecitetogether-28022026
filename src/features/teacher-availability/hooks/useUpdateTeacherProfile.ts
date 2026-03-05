import { useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';
import type { UpdateTeacherProfileInput } from '../types/availability.types';

export function useUpdateTeacherProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTeacherProfileInput) => {
      const { data, error } = await availabilityService.updateTeacherProfile(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
  });
}
