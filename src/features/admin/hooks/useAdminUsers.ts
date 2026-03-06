import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { AdminUser } from '../types/admin.types';

export function useAdminUsers(searchQuery: string) {
  return useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const { data, error } = await adminService.searchUsersForRoleAssignment({
        p_search_query: searchQuery,
      });
      if (error) throw error;
      return (data as unknown as AdminUser[]) ?? [];
    },
    enabled: searchQuery.length >= 2,
  });
}
