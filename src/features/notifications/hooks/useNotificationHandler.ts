import { useEffect, useRef, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import type { DeepLinkData, NotificationPayload } from '../types/notifications.types';

interface UseNotificationHandlerOptions {
  isAuthenticated: boolean;
  onForegroundNotification?: (payload: NotificationPayload) => void;
}

export function useNotificationHandler({
  isAuthenticated,
  onForegroundNotification,
}: UseNotificationHandlerOptions) {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const receivedListener = useRef<Notifications.Subscription | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);

  // Navigate to the deep-link screen from notification data
  const handleDeepLink = useCallback(
    (data: DeepLinkData | undefined) => {
      if (!data?.screen) return;

      try {
        if (data.params) {
          router.push({ pathname: data.screen as `/${string}`, params: data.params });
        } else {
          router.push(data.screen as `/${string}`);
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[Notifications] Deep-link navigation error:', error);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    // Handle notification tap (background/killed → app opens)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as unknown as DeepLinkData | undefined;
        handleDeepLink(data);
      },
    );

    // Handle foreground notification received
    receivedListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        const payload: NotificationPayload = {
          title: title ?? '',
          body: body ?? '',
          data: data as unknown as DeepLinkData | undefined,
        };

        setLastNotification(payload);
        onForegroundNotification?.(payload);
      },
    );

    return () => {
      responseListener.current?.remove();
      receivedListener.current?.remove();
    };
  }, [isAuthenticated, handleDeepLink, onForegroundNotification]);

  return {
    lastNotification,
    navigateToNotification: handleDeepLink,
  };
}
