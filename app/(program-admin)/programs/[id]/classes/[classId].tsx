import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useClassEnrollments, useUpdateEnrollmentStatus } from '@/features/programs/hooks/useAdminEnrollments';
import { useUpdateClassStatus, useBulkApproveEnrollments } from '@/features/programs/hooks/useAdminClasses';
import { useProgramClasses } from '@/features/programs/hooks/useClasses';
import { useClassWaitlist } from '@/features/programs/hooks/useWaitlist';
import { getNextClassStatus } from '@/features/programs/utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { ClassStatus } from '@/features/programs/types/programs.types';

export default function ClassDetailScreen() {
  const { id, classId } = useLocalSearchParams<{ id: string; classId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: classes } = useProgramClasses({ programId: id! });
  const programClass = classes?.find((c) => c.id === classId);

  const { data: enrollments = [], isLoading, error, refetch } = useClassEnrollments(classId);
  const { data: waitlist = [] } = useClassWaitlist(classId);
  const updateClassStatus = useUpdateClassStatus(id!);
  const updateEnrollment = useUpdateEnrollmentStatus();
  const bulkApprove = useBulkApproveEnrollments(id!);

  const handleStatusTransition = () => {
    if (!programClass) return;
    const next = getNextClassStatus(programClass.status);
    if (!next) return;

    const confirmMsg =
      next === 'in_progress'
        ? t('programs.confirm.bulkApproveBody', { count: enrollments.filter((e: any) => e.status === 'pending').length })
        : '';

    Alert.alert(
      t(`programs.classStatus.${next}`),
      confirmMsg,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            if (next === 'in_progress') {
              await bulkApprove.mutateAsync(classId!);
            }
            updateClassStatus.mutate({ classId: classId!, status: next });
          },
        },
      ],
    );
  };

  const nextStatus = programClass ? getNextClassStatus(programClass.status) : null;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{programClass?.name ?? '—'}</Text>
          <View style={{ width: 60 }} />
        </View>

        {programClass && (
          <View style={styles.statusRow}>
            <Badge
              label={t(`programs.classStatus.${programClass.status}`)}
              variant={programClass.status === 'enrollment_open' ? 'success' : 'info'}
              size="sm"
            />
            {nextStatus && (
              <Button
                title={t(`programs.classAction.${nextStatus}`)}
                onPress={handleStatusTransition}
                variant="primary"
                size="sm"
                loading={updateClassStatus.isPending || bulkApprove.isPending}
              />
            )}
          </View>
        )}

        {waitlist.length > 0 && (
          <Button
            title={`${t('programs.labels.waitlist')} (${waitlist.length})`}
            onPress={() =>
              router.push({
                pathname: '/(program-admin)/waitlist/[classId]',
                params: { classId: classId! },
              })
            }
            variant="secondary"
            size="sm"
          />
        )}

        <Text style={styles.sectionTitle}>{t('programs.labels.enrollments')}</Text>

        {enrollments.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('programs.empty.enrollments')}
          />
        ) : (
          <FlashList
            data={enrollments}
            keyExtractor={(item: any) => item.id}
            estimatedItemSize={70}
            renderItem={({ item }: { item: any }) => (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.profiles?.full_name ?? '—'}
                  </Text>
                  <Badge
                    label={t(`programs.status.${item.status}`)}
                    variant={item.status === 'active' ? 'success' : item.status === 'pending' ? 'warning' : 'default'}
                    size="sm"
                  />
                </View>
                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <Button
                      title={t('programs.actions.approve')}
                      onPress={() =>
                        updateEnrollment.mutate({ enrollmentId: item.id, status: 'active' })
                      }
                      variant="primary"
                      size="sm"
                    />
                    <Button
                      title={t('programs.actions.reject')}
                      onPress={() =>
                        Alert.alert(t('programs.confirm.reject'), '', [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('programs.actions.reject'),
                            style: 'destructive',
                            onPress: () =>
                              updateEnrollment.mutate({ enrollmentId: item.id, status: 'dropped' }),
                          },
                        ])
                      }
                      variant="danger"
                      size="sm"
                    />
                  </View>
                )}
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
