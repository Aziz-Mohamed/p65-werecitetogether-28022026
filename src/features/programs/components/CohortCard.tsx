import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { CohortWithTeacher } from '../types/programs.types';

interface CohortCardProps {
  cohort: CohortWithTeacher;
  onEnroll?: () => void;
  disabled?: boolean;
}

export function CohortCard({ cohort, onEnroll, disabled }: CohortCardProps) {
  const { t } = useTranslation();

  const enrolledCount = cohort.enrollments?.[0]?.count ?? 0;
  const isFull = enrolledCount >= cohort.max_students;
  const isOpen = cohort.status === 'enrollment_open';

  return (
    <Card
      variant="outlined"
      style={styles.card}
      onPress={isOpen && !disabled ? onEnroll : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {cohort.name}
        </Text>
        {isFull && (
          <Badge label={t('programs.labels.full')} variant="error" size="sm" />
        )}
      </View>

      {cohort.profiles?.full_name && (
        <View style={styles.row}>
          <Ionicons name="person-outline" size={normalize(14)} color={lightTheme.textSecondary} />
          <Text style={styles.detail}>{cohort.profiles.full_name}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Ionicons name="people-outline" size={normalize(14)} color={lightTheme.textSecondary} />
        <Text style={styles.detail}>
          {enrolledCount}/{cohort.max_students} {t('programs.labels.students')}
        </Text>
      </View>

      {cohort.schedule && cohort.schedule.length > 0 && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={normalize(14)} color={lightTheme.textSecondary} />
          <Text style={styles.detail}>
            {t('programs.labels.schedule')} ({cohort.schedule.length}x)
          </Text>
        </View>
      )}

      {isOpen && !disabled && (
        <View style={styles.footer}>
          <Text style={[styles.enrollText, isFull && styles.waitlistText]}>
            {isFull ? t('programs.actions.joinWaitlist') : t('programs.actions.enroll')}
          </Text>
          <Ionicons
            name={isFull ? 'time-outline' : I18nManager.isRTL ? 'arrow-back' : 'arrow-forward'}
            size={normalize(16)}
            color={isFull ? colors.accent.orange[500] : colors.primary[600]}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: lightTheme.border,
  },
  enrollText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[600],
  },
  waitlistText: {
    color: colors.accent.orange[500],
  },
});
