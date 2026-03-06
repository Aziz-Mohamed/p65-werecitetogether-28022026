import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { CertificationPipeline } from '../types/certifications.types';

export function useCertificationPipeline(programId: string | undefined) {
  return useQuery({
    queryKey: ['certifications', 'pipeline', programId],
    queryFn: async () => {
      if (!programId) return null;
      const { data, error } = await certificationsService.getPipeline(programId);
      if (error) throw error;
      return data as unknown as CertificationPipeline;
    },
    enabled: !!programId,
  });
}
