import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { RegistrationWithProfiles } from '../types/himam.types';

export function useMyRegistration(eventId: string | undefined, studentId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'registration', eventId, studentId],
    queryFn: async () => {
      if (!eventId || !studentId) return null;
      const { data, error } = await himamService.getMyRegistration(eventId, studentId);
      if (error) throw error;
      return (data ?? null) as RegistrationWithProfiles | null;
    },
    enabled: !!eventId && !!studentId,
  });
}
