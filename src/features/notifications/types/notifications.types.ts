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

// ─── Queue Offer Data ───────────────────────────────────────────────────────

export interface QueueOfferData {
  teacherName: string;
  platform: string;
  expiresAt: string;
  queueEntryId: string;
  programId: string;
}

// ─── Notification Payload ────────────────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  data?: DeepLinkData;
  categoryId?: NotificationCategory;
  queueOffer?: QueueOfferData;
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
