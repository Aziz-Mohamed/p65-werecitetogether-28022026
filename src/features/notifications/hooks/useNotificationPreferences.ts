import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsService } from '../services/notifications.service';
import type { NotificationPreferencesForm } from '../types/notifications.types';

export function useNotificationPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => notificationsService.getPreferences(userId!),
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferencesForm>) => {
      if (!userId) throw new Error('Cannot update preferences: no user ID');
      return notificationsService.upsertPreferences(userId, prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', userId],
      });
    },
  });
}
