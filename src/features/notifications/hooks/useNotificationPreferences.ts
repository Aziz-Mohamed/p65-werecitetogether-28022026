import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsService } from '../services/notifications.service';

export function useNotificationPreferences(profileId: string | undefined) {
  return useQuery({
    queryKey: ['notification-preferences', profileId],
    queryFn: async () => {
      const result = await notificationsService.getPreferences(profileId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!profileId,
  });
}

export function useUpdateNotificationPreference(profileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, enabled }: { category: string; enabled: boolean }) => {
      if (!profileId) throw new Error('Cannot update preferences: no profile ID');
      const result = await notificationsService.updatePreference(profileId, category, enabled);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', profileId],
      });
    },
  });
}
