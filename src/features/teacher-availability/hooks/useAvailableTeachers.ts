import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';
import type { AvailableTeacher } from '../types/availability.types';

export function useAvailableTeachers(programId: string | undefined) {
  return useQuery({
    queryKey: ['available-teachers', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID required');
      const { data, error } = await availabilityService.getAvailableTeachers(programId);
      if (error) throw error;
      return (data ?? []) as unknown as AvailableTeacher[];
    },
    enabled: !!programId,
  });
}
