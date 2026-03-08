import { useQuery } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { RegistrationWithEvent } from '../types/himam.types';

export function useHimamHistory(studentId: string | undefined) {
  return useQuery({
    queryKey: ['himam', 'history', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await himamService.getHistory(studentId);
      if (error) throw error;
      return (data ?? []) as RegistrationWithEvent[];
    },
    enabled: !!studentId,
  });
}
