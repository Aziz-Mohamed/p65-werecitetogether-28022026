import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CertificationCard } from '@/features/certifications/components/CertificationCard';
import { useCertificationQueue } from '@/features/certifications/hooks/useCertificationQueue';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';

export default function SupervisorCertificationsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const teachers = useSupervisedTeachers(userId);
  const programId = teachers.data?.[0]?.program_id;

  const queue = useCertificationQueue(programId, 'supervisor');

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('certifications.queue.supervisorTitle')}</Text>
        <FlashList
          data={queue.data ?? []}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={queue.isRefetching}
              onRefresh={() => queue.refetch()}
            />
          }
          renderItem={({ item }) => (
            <CertificationCard
              id={item.id}
              studentName={item.student_name}
              teacherName={item.teacher_name}
              programName={item.program_name}
              trackName={item.track_name}
              type={item.type}
              status={item.status}
              title={item.title}
              createdAt={item.created_at}
              onPress={() =>
                router.push({
                  pathname: '/(supervisor)/certifications/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !queue.isLoading ? (
              queue.isError ? (
                <ErrorState onRetry={() => queue.refetch()} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t('certifications.queue.empty')}
                  </Text>
                </View>
              )
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
