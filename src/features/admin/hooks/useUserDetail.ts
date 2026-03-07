import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export function useUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => {
      const { data, error } = await adminService.getUserDetail(id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
