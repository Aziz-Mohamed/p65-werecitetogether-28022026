import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { WikiScreen } from '@/features/wiki';

export default function ProgramAdminWiki() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('wiki.pageTitle') }} />
      <WikiScreen role="program_admin" />
    </>
  );
}
