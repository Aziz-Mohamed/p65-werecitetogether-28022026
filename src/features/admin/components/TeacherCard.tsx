import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import type { SupervisedTeacher } from '../types/admin.types';

interface TeacherCardProps {
  teacher: SupervisedTeacher;
  onPress?: () => void;
}

export function TeacherCard({ teacher, onPress }: TeacherCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined" onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Avatar
          source={teacher.avatar_url ?? undefined}
          name={teacher.full_name}
          size="md"
        />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {teacher.full_name}
          </Text>
          <Text style={styles.program} numberOfLines={1}>
            {teacher.program_name}
          </Text>
        </View>
        {!teacher.is_active && (
          <Badge label={t('admin.supervisor.inactiveFlag')} variant="warning" size="sm" />
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.student_count}</Text>
          <Text style={styles.statLabel}>
            {t('admin.supervisor.teacherCard.students', { count: teacher.student_count })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.sessions_this_week}</Text>
          <Text style={styles.statLabel}>
            {t('admin.supervisor.teacherCard.sessions', { count: teacher.sessions_this_week })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {teacher.average_rating != null
              ? teacher.average_rating.toFixed(1)
              : '-'}
          </Text>
          <Text style={styles.statLabel}>
            {teacher.average_rating != null
              ? t('admin.supervisor.teacherCard.rating', { rating: teacher.average_rating.toFixed(1) })
              : t('admin.supervisor.teacherCard.noRating')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  program: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    fontSize: normalize(16),
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    fontSize: normalize(10),
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: normalize(28),
    backgroundColor: lightTheme.border,
  },
});
