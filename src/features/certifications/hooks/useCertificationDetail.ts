import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { CertificationWithDetails } from '../types/certifications.types';

export function useCertificationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['certifications', 'detail', id],
    queryFn: async () => {
      const { data, error } = await certificationsService.getCertificationById(id!);
      if (error) throw error;
      return data as unknown as CertificationWithDetails;
    },
    enabled: !!id,
  });
}
