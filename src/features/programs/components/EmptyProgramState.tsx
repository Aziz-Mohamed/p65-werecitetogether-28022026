import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback';

export function EmptyProgramState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="library-outline"
      title={t('programs.empty.programs')}
      description={t('programs.empty.programsDesc')}
    />
  );
}
