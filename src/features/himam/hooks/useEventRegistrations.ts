import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { RegistrationWithProfiles } from '../types/himam.types';

export function useEventRegistrations(eventId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'registrations', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await himamService.getEventRegistrations(eventId);
      if (error) throw error;
      return (data ?? []) as RegistrationWithProfiles[];
    },
    enabled: !!eventId,
  });
}
