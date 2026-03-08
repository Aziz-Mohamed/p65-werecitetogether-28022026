import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export function useSupervisors(filters?: { searchQuery?: string }) {
  return useQuery({
    queryKey: ['supervisors', filters],
    queryFn: async () => {
      const { data, error } = await adminService.getSupervisors(filters);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
