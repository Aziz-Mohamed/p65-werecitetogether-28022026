import React from 'react';
import { StyleSheet, View, Text, Alert, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useClassEnrollments, useUpdateEnrollmentStatus } from '@/features/programs/hooks/useAdminEnrollments';
import { useUpdateClassStatus, useBulkApproveEnrollments } from '@/features/programs/hooks/useAdminClasses';
import { useProgramClasses } from '@/features/programs/hooks/useClasses';
import { getNextClassStatus } from '@/features/programs/utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function MasterAdminClassDetailScreen() {
  const { id, classId } = useLocalSearchParams<{ id: string; classId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: classes } = useProgramClasses({ programId: id! });
  const programClass = classes?.find((c) => c.id === classId);

  const { data: enrollments = [], isLoading, error, refetch } = useClassEnrollments(classId);
  const updateClassStatus = useUpdateClassStatus(id!);
  const updateEnrollment = useUpdateEnrollmentStatus();
  const bulkApprove = useBulkApproveEnrollments(id!);

  const handleStatusTransition = () => {
    if (!programClass) return;
    const next = getNextClassStatus(programClass.status);
    if (!next) return;

    const pendingCount = enrollments.filter((e: any) => e.status === 'pending').length;
    const confirmMsg =
      next === 'in_progress'
        ? t('programs.confirm.bulkApproveBody', { count: pendingCount })
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
        <PageHeader title={programClass?.name ?? '—'} />

        {programClass && (
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              {t(`programs.classStatus.${programClass.status}`)}
            </Text>
            {programClass.profiles?.full_name && (
              <>
                <View style={styles.dot} />
                <Ionicons name="person-outline" size={normalize(13)} color={colors.neutral[400]} />
                <Text style={styles.metaText}>{programClass.profiles.full_name}</Text>
              </>
            )}
            <View style={{ flex: 1 }} />
            {nextStatus && (
              <Button
                title={t(`programs.classAction.${nextStatus}`)}
                onPress={handleStatusTransition}
                variant="ghost"
                size="sm"
                loading={updateClassStatus.isPending || bulkApprove.isPending}
              />
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {t('programs.labels.enrollments')} ({enrollments.length})
        </Text>

        {enrollments.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('programs.empty.enrollments')}
          />
        ) : (
          <FlashList
            data={enrollments}
            keyExtractor={(item: any) => item.id}
            estimatedItemSize={56}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.studentRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.profiles?.full_name ?? '—'}
                  </Text>
                  <Text style={styles.studentStatus}>
                    {t(`programs.status.${item.status}`)}
                  </Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <Button
                      title={t('programs.actions.approve')}
                      onPress={() =>
                        updateEnrollment.mutate({ enrollmentId: item.id, status: 'active' })
                      }
                      variant="ghost"
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
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  dot: {
    width: normalize(3),
    height: normalize(3),
    borderRadius: normalize(1.5),
    backgroundColor: colors.neutral[300],
  },
  metaText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(13),
    color: colors.neutral[400],
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  studentRow: {
    paddingVertical: spacing.base,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  studentStatus: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[400],
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: lightTheme.border,
  },
});
