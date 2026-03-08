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
    deepLink: { screen: '/(student)/sessions/index' },
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
    id: 'student_alert',
    labelKey: 'notifications.categories.studentAlert',
    descriptionKey: 'notifications.categories.studentAlertDesc',
    icon: 'alert-circle-outline',
    roles: ['teacher'],
    preferenceColumn: 'student_alert',
    deepLink: { screen: '/(teacher)/(tabs)/students' },
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
  student_stickers: 'sticker_awarded',
  student_trophies: 'trophy_earned',
  student_achievements: 'achievement_unlocked',
  attendance: 'attendance_marked',
  sessions: 'session_completed',
};
