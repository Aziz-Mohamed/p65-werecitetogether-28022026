export { useNotificationSetup } from './hooks/useNotificationSetup';
export { useNotificationHandler } from './hooks/useNotificationHandler';
export { useNotificationPreferences, useUpdateNotificationPreference } from './hooks/useNotificationPreferences';
export { notificationsService } from './services/notifications.service';
export { NotificationSoftAsk } from './components/NotificationSoftAsk';
export { InAppBanner } from './components/InAppBanner';
export type {
  PushToken,
  NotificationPreference,
  NotificationCategory,
  NotificationPayload,
  DeepLinkData,
  UserRole,
  CategoryConfig,
} from './types/notifications.types';
