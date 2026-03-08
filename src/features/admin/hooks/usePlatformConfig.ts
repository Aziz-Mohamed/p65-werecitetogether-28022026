import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { PlatformConfig, UpdatePlatformConfigInput } from '../types/admin.types';

export function usePlatformConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const { data, error } = await adminService.getPlatformConfig();
      if (error) throw error;
      return data as unknown as PlatformConfig;
    },
    staleTime: 10 * 60 * 1000,
  });

  const update = useMutation({
    mutationFn: (input: UpdatePlatformConfigInput) => {
      if (!query.data?.id) throw new Error('No platform config found');
      return adminService.updatePlatformConfig(query.data.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-config'] });
    },
  });

  return { ...query, update };
}
