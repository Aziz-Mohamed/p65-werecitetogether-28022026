export { useNotificationSetup } from './hooks/useNotificationSetup';
export { useNotificationHandler } from './hooks/useNotificationHandler';
export { useNotificationPreferences, useUpdateNotificationPreferences } from './hooks/useNotificationPreferences';
export { notificationsService } from './services/notifications.service';
export { NotificationSoftAsk } from './components/NotificationSoftAsk';
export { InAppBanner } from './components/InAppBanner';
export type {
  PushToken,
  NotificationPreferences,
  NotificationCategory,
  NotificationPayload,
  DeepLinkData,
  UserRole,
} from './types/notifications.types';
