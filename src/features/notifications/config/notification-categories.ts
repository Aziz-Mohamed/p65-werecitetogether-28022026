import type { CategoryConfig, UserRole } from '../types/notifications.types';

export const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  {
    id: 'sticker_awarded',
    labelKey: 'notifications.categories.stickerAwarded',
    descriptionKey: 'notifications.categories.stickerAwardedDesc',
    icon: 'star-outline',
    roles: ['student'],
    preferenceColumn: 'sticker_awarded',
    deepLink: { screen: '/(student)/(tabs)/stickers' },
  },
  {
    id: 'trophy_earned',
    labelKey: 'notifications.categories.trophyEarned',
    descriptionKey: 'notifications.categories.trophyEarnedDesc',
    icon: 'trophy-outline',
    roles: ['student'],
    preferenceColumn: 'trophy_earned',
    deepLink: { screen: '/(student)/trophy-room' },
  },
  {
    id: 'achievement_unlocked',
    labelKey: 'notifications.categories.achievementUnlocked',
    descriptionKey: 'notifications.categories.achievementUnlockedDesc',
    icon: 'ribbon-outline',
    roles: ['student'],
    preferenceColumn: 'achievement_unlocked',
    deepLink: { screen: '/(student)/(tabs)/stickers' },
  },
  {
    id: 'session_completed',
    labelKey: 'notifications.categories.sessionCompleted',
    descriptionKey: 'notifications.categories.sessionCompletedDesc',
    icon: 'book-outline',
    roles: ['student'],
    preferenceColumn: 'session_completed',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'daily_summary',
    labelKey: 'notifications.categories.dailySummary',
    descriptionKey: 'notifications.categories.dailySummaryDesc',
    icon: 'newspaper-outline',
    roles: ['teacher'],
    preferenceColumn: 'daily_summary',
    deepLink: { screen: '/(teacher)/(tabs)/index' },
  },
  {
    id: 'enrollment_approved',
    labelKey: 'notifications.categories.enrollment',
    descriptionKey: 'notifications.categories.enrollmentDesc',
    icon: 'checkmark-done-outline',
    roles: ['student'],
    preferenceColumn: 'enrollment_updates',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'waitlist_offer',
    labelKey: 'notifications.categories.waitlist',
    descriptionKey: 'notifications.categories.waitlistDesc',
    icon: 'time-outline',
    roles: ['student'],
    preferenceColumn: 'waitlist_updates',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'cohort_update',
    labelKey: 'notifications.categories.cohort',
    descriptionKey: 'notifications.categories.cohortDesc',
    icon: 'grid-outline',
    roles: ['student', 'teacher'],
    preferenceColumn: 'cohort_updates',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'voice_memo_received',
    labelKey: 'notifications.categories.voiceMemo',
    descriptionKey: 'notifications.categories.voiceMemoDesc',
    icon: 'mic-outline',
    roles: ['student'],
    preferenceColumn: 'voice_memo_updates',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'queue_threshold',
    labelKey: 'notifications.categories.queueThreshold',
    descriptionKey: 'notifications.categories.queueThresholdDesc',
    icon: 'people-outline',
    roles: ['teacher'],
    preferenceColumn: 'queue_threshold',
    deepLink: { screen: '/(teacher)/(tabs)/index' },
  },
  {
    id: 'rating_prompt',
    labelKey: 'notifications.categories.ratingPrompt',
    descriptionKey: 'notifications.categories.ratingPromptDesc',
    icon: 'star-half-outline',
    roles: ['student'],
    preferenceColumn: 'rating_prompt',
    deepLink: { screen: '/(student)/(tabs)/index' },
  },
  {
    id: 'supervisor_alert',
    labelKey: 'notifications.categories.supervisorAlert',
    descriptionKey: 'notifications.categories.supervisorAlertDesc',
    icon: 'shield-outline',
    roles: ['supervisor'],
    preferenceColumn: 'supervisor_alert',
    deepLink: { screen: '/(supervisor)/(tabs)/index' },
  },
];

/**
 * Returns notification categories applicable to a given user role.
 */
export function getCategoriesForRole(role: UserRole): CategoryConfig[] {
  return NOTIFICATION_CATEGORIES.filter((cat) => cat.roles.includes(role));
}

/**
 * Maps a source database table name to its notification category.
 */
export const TABLE_TO_CATEGORY: Record<string, CategoryConfig['id']> = {
  sessions: 'session_completed',
  enrollments: 'enrollment_approved',
  program_waitlist: 'waitlist_offer',
  cohorts: 'cohort_update',
  session_voice_memos: 'voice_memo_received',
};
