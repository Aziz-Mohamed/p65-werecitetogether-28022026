import { useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';

interface JoinSessionInput {
  availabilityId: string;
  meetingLink: string;
  programId: string;
}

export function useJoinSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinSessionInput) => {
      const { data, error } = await availabilityService.joinSession(input.availabilityId);
      if (error) throw error;
      return data as unknown as boolean;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['available-teachers', variables.programId] });
    },
  });
}
