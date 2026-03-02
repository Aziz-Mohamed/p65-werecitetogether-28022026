import { useQuery } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';

export const useActiveDraftSession = (studentId: string | undefined) =>
  useQuery({
    queryKey: ['active-draft-session', studentId],
    queryFn: async () => {
      const result = await sessionsService.getActiveDraftSession(studentId!);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!studentId,
    staleTime: 30_000,
  });
