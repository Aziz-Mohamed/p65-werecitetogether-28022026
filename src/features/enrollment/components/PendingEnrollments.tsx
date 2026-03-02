import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  usePendingEnrollmentsByCohort,
  useApproveEnrollment,
  useDropEnrollment,
} from '../hooks/useEnrollment';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { EnrollmentWithProfile } from '../types';

interface PendingEnrollmentsProps {
  cohortId: string;
}

export function PendingEnrollments({ cohortId }: PendingEnrollmentsProps) {
  const { t } = useTranslation();
  const { data: pending = [], isLoading } = usePendingEnrollmentsByCohort(cohortId);
  const approve = useApproveEnrollment();
  const drop = useDropEnrollment();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (pending.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="checkmark-circle-outline" size={32} color={neutral[300]} />
        <Text style={styles.emptyText}>{t('enrollment.noEnrollments')}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: EnrollmentWithProfile }) => (
    <Card variant="outlined" style={styles.enrollmentCard}>
      <View style={styles.studentRow}>
        <Avatar
          name={item.student_profile?.display_name ?? item.student_profile?.full_name ?? ''}
          avatarUrl={item.student_profile?.avatar_url ?? undefined}
          size="sm"
        />
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.student_profile?.display_name ?? item.student_profile?.full_name ?? '—'}
          </Text>
          <Text style={styles.enrollDate}>
            {new Date(item.enrolled_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={t('common.approve')}
          onPress={() => approve.mutate(item.id)}
          variant="primary"
          size="sm"
          loading={approve.isPending}
        />
        <Button
          title={t('common.reject')}
          onPress={() => drop.mutate(item.id)}
          variant="ghost"
          size="sm"
          loading={drop.isPending}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('enrollment.pendingApproval')} ({pending.length})
      </Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  loading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  list: {
    gap: spacing.sm,
  },
  enrollmentCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  enrollDate: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.xl,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
});
