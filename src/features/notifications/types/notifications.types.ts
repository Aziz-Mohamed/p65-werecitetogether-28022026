import type { Tables } from '@/types/database.types';
import type { UserRole, NotificationCategory } from '@/types/common.types';

// Re-export for backward compatibility within notifications feature
export type { UserRole, NotificationCategory };

// ─── Database Row Types ──────────────────────────────────────────────────────

export type PushToken = Tables<'push_tokens'>;
export type NotificationPreference = Tables<'notification_preferences'>;

// ─── Deep-Link Data ──────────────────────────────────────────────────────────

export interface DeepLinkData {
  screen: string;
  params?: Record<string, string>;
}

// ─── Notification Payload ────────────────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  data?: DeepLinkData;
  categoryId?: NotificationCategory;
}

// ─── Category Config ────────────────────────────────────────────────────────

export interface CategoryConfig {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  roles: UserRole[];
  preferenceColumn: string;
  deepLink?: DeepLinkData;
}
