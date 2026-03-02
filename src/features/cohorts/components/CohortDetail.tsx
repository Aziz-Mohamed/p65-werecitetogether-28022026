import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useCohortById, useUpdateCohortStatus } from '../hooks/useCohorts';
import { useEnrollmentsByCohort } from '@/features/enrollment/hooks/useEnrollment';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { CohortStatus } from '../types';
import type { EnrollmentWithProfile } from '@/features/enrollment/types';

const STATUS_TRANSITIONS: Record<string, CohortStatus | null> = {
  enrollment_open: 'enrollment_closed',
  enrollment_closed: 'in_progress',
  in_progress: 'completed',
  completed: 'archived',
  archived: null,
};

interface CohortDetailProps {
  cohortId: string;
}

export function CohortDetail({ cohortId }: CohortDetailProps) {
  const { t } = useTranslation();
  const { data: cohort, isLoading } = useCohortById(cohortId);
  const { data: enrollments = [] } = useEnrollmentsByCohort(cohortId);
  const updateStatus = useUpdateCohortStatus();

  if (isLoading || !cohort) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const nextStatus = STATUS_TRANSITIONS[cohort.status];

  const handleStatusChange = () => {
    if (nextStatus) {
      updateStatus.mutate({ id: cohortId, status: nextStatus });
    }
  };

  const renderStudent = ({ item }: { item: EnrollmentWithProfile }) => (
    <View style={styles.studentRow}>
      <Avatar
        name={item.student_profile?.display_name ?? item.student_profile?.full_name ?? ''}
        avatarUrl={item.student_profile?.avatar_url ?? undefined}
        size="sm"
      />
      <Text style={styles.studentName} numberOfLines={1}>
        {item.student_profile?.display_name ?? item.student_profile?.full_name ?? '—'}
      </Text>
      <Badge label={item.status} variant="default" size="sm" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cohort Info */}
      <Card variant="default" style={styles.infoCard}>
        <Text style={styles.cohortName}>{cohort.name}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('cohorts.maxStudents')}</Text>
          <Text style={styles.infoValue}>{cohort.max_students}</Text>
        </View>

        {cohort.teacher_profile && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('cohorts.teacher')}</Text>
            <Text style={styles.infoValue}>
              {cohort.teacher_profile.display_name ?? cohort.teacher_profile.full_name}
            </Text>
          </View>
        )}

        {cohort.supervisor_profile && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('cohorts.supervisor')}</Text>
            <Text style={styles.infoValue}>
              {cohort.supervisor_profile.display_name ?? cohort.supervisor_profile.full_name}
            </Text>
          </View>
        )}

        {cohort.start_date && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('cohorts.startDate')}</Text>
            <Text style={styles.infoValue}>
              {new Date(cohort.start_date).toLocaleDateString()}
            </Text>
          </View>
        )}

        {nextStatus && (
          <Button
            title={t(`cohorts.status.${nextStatus}`)}
            onPress={handleStatusChange}
            variant="primary"
            size="sm"
            loading={updateStatus.isPending}
          />
        )}
      </Card>

      {/* Roster */}
      <Text style={styles.sectionTitle}>{t('cohorts.roster')}</Text>

      {enrollments.length === 0 ? (
        <View style={styles.emptyRoster}>
          <Ionicons name="people-outline" size={32} color={neutral[300]} />
          <Text style={styles.emptyText}>{t('cohorts.emptyRoster')}</Text>
        </View>
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          scrollEnabled={false}
          contentContainerStyle={styles.rosterList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  loading: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
  infoCard: {
    gap: spacing.sm,
  },
  cohortName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  infoValue: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  rosterList: {
    gap: spacing.sm,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  emptyRoster: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.xl,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
});
