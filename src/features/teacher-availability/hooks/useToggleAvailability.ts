import { useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';
import type { ToggleAvailabilityInput } from '../types/availability.types';

export function useToggleAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ToggleAvailabilityInput) =>
      availabilityService.toggleAvailability(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      queryClient.invalidateQueries({ queryKey: ['available-teachers'] });
    },
  });
}
