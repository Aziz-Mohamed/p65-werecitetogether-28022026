import type { Tables } from '@/types/database.types';

// ─── Database Row Types ──────────────────────────────────────────────────────

export type PushToken = Tables<'push_tokens'>;
export type NotificationPreferences = Tables<'notification_preferences'>;

// ─── Notification Categories ─────────────────────────────────────────────────

export type NotificationCategory =
  | 'sticker_awarded'
  | 'trophy_earned'
  | 'achievement_unlocked'
  | 'attendance_marked'
  | 'session_completed'
  | 'daily_summary'
  | 'student_alert';

export type UserRole = 'student' | 'teacher' | 'admin';

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

// ─── Category Config ─────────────────────────────────────────────────────────

export interface CategoryConfig {
  id: NotificationCategory;
  /** i18n key for the category display name */
  labelKey: string;
  /** i18n key for the description subtitle */
  descriptionKey: string;
  /** Ionicons icon name */
  icon: string;
  /** Which roles receive this notification type */
  roles: UserRole[];
  /** Column name on notification_preferences table */
  preferenceColumn: keyof Omit<
    NotificationPreferences,
    'user_id' | 'quiet_hours_enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'created_at' | 'updated_at'
  >;
  /** Deep-link target screen */
  deepLink: DeepLinkData;
}

// ─── Preferences Form ────────────────────────────────────────────────────────

export interface NotificationPreferencesForm {
  sticker_awarded: boolean;
  trophy_earned: boolean;
  achievement_unlocked: boolean;
  attendance_marked: boolean;
  session_completed: boolean;
  daily_summary: boolean;
  student_alert: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}
