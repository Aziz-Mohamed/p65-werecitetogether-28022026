import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '../services/availability.service';
import type { TeacherProfileExtensions } from '../types/availability.types';

export function useTeacherProfile() {
  return useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const { data, error } = await availabilityService.getTeacherProfile();
      if (error) throw error;
      return data as unknown as TeacherProfileExtensions;
    },
  });
}
