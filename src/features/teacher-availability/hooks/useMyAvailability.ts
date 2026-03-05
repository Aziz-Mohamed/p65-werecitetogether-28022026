import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';
import type { MyAvailability } from '../types/availability.types';

export function useMyAvailability() {
  return useQuery({
    queryKey: ['my-availability'],
    queryFn: async () => {
      const { data, error } = await availabilityService.getMyAvailability();
      if (error) throw error;
      return (data ?? []) as unknown as MyAvailability[];
    },
  });
}
