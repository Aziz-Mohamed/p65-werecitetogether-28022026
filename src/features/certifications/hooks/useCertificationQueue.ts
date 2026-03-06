import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { CertificationQueueItem } from '../types/certifications.types';

export function useCertificationQueue(programId: string | undefined, role: 'supervisor' | 'program_admin') {
  return useQuery({
    queryKey: ['certifications', 'queue', programId, role],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await certificationsService.getQueue(programId, role);
      if (error) throw error;
      return (data ?? []) as CertificationQueueItem[];
    },
    enabled: !!programId,
  });
}
