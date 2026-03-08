import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { useAuthStore } from '@/stores/authStore';
import { authService } from '../services/auth.service';
import { notificationsService } from '@/features/notifications/services/notifications.service';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async () => {
      // Remove the current device's push token before signing out
      try {
        if (Device.isDevice) {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

          if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            await notificationsService.removeToken(tokenData.data);
          }
        }
      } catch (error) {
        // Non-blocking — proceed with logout even if token removal fails
        if (__DEV__) {
          console.log('[Logout] Push token removal error:', error);
        }
      }

      const result = await authService.logout();

      if (result.error) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: () => {
      // Clear auth store
      clearAuth();

      // Clear all cached queries
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
