import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';
import type { MasterAdminProgramSummary } from '../types/admin.types';

interface ProgramSummaryRowProps {
  program: MasterAdminProgramSummary;
}

export function ProgramSummaryRow({ program }: ProgramSummaryRowProps) {
  const { t, i18n } = useTranslation();

  const name = i18n.language === 'ar' ? program.name_ar : program.name;

  return (
    <Card variant="outlined" style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>
          {t('admin.masterAdmin.dashboard.enrolled', { count: program.enrolled_count })}
        </Text>
        <Text style={styles.stat}>
          {t('admin.masterAdmin.dashboard.sessions', { count: program.session_count })}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  stat: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
