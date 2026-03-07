import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export function useProgramAdmins(filters?: { searchQuery?: string }) {
  return useQuery({
    queryKey: ['program-admins', filters],
    queryFn: async () => {
      const { data, error } = await adminService.getProgramAdmins(filters);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
