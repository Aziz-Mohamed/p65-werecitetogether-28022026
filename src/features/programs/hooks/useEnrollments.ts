import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { EnrollmentWithDetails } from '../types/programs.types';

export function useEnrollments(userId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await programsService.getMyEnrollments(userId);
      if (error) throw error;
      return (data ?? []) as EnrollmentWithDetails[];
    },
    enabled: !!userId,
  });
}
