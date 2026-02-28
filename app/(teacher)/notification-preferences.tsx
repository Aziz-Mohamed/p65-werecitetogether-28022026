import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { NotificationPreferences } from '@/features/notifications/components/NotificationPreferences';

export default function TeacherNotificationPreferencesScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('notifications.preferences.title') }} />
      <NotificationPreferences />
    </>
  );
}
