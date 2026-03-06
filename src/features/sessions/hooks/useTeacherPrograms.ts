import { useQuery } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';

export const useTeacherPrograms = () => {
  return useQuery({
    queryKey: ['teacher-programs'],
    queryFn: async () => {
      const { data, error } = await sessionsService.getTeacherPrograms();
      if (error) throw error;
      return data ?? [];
    },
  });
};
