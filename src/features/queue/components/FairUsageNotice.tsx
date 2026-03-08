import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useDailySessionCount } from '../hooks/useDailySessionCount';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface FairUsageNoticeProps {
  programId: string;
}

export function FairUsageNotice({ programId }: FairUsageNoticeProps) {
  const { t } = useTranslation();
  const { data } = useDailySessionCount(programId);

  if (!data || !data.has_reached_limit) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={normalize(18)} color={colors.accent.amber[500]} />
      <View style={styles.textContainer}>
        <Text style={styles.message}>
          {t('queue.fairUsage.message', { count: data.session_count })}
        </Text>
        <Text style={styles.softLimit}>{t('queue.fairUsage.softLimit')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.accent.amber[50],
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: colors.accent.amber[200],
  },
  textContainer: {
    flex: 1,
    gap: normalize(2),
  },
  message: {
    ...typography.textStyles.caption,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
  },
  softLimit: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
});
