import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { CertificationFilters } from '../types/certifications.types';

export function useAllCertifications(filters: CertificationFilters) {
  return useQuery({
    queryKey: ['certifications', 'all', filters],
    queryFn: async () => {
      const { data, error } = await certificationsService.getAllCertifications(filters);
      if (error) throw error;
      return data ?? [];
    },
  });
}
