import React, { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CertificationCard } from '@/features/certifications/components/CertificationCard';
import { CertificatePipelineView } from '@/features/certifications/components/CertificatePipeline';
import { useCertificationQueue } from '@/features/certifications/hooks/useCertificationQueue';
import { useCertificationPipeline } from '@/features/certifications/hooks/useCertificationPipeline';
import type { CertificationStatus } from '@/features/certifications/types/certifications.types';

export default function ProgramAdminCertificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const [filterStatus, setFilterStatus] = useState<CertificationStatus | null>(null);

  const pipeline = useCertificationPipeline(programId);
  const queue = useCertificationQueue(programId, 'program_admin');

  const filteredData = filterStatus
    ? (queue.data ?? []).filter((item) => item.status === filterStatus)
    : queue.data ?? [];

  const handleRefresh = () => {
    pipeline.refetch();
    queue.refetch();
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('certifications.queue.programAdminTitle')}</Text>

        {pipeline.data && (
          <CertificatePipelineView
            pipeline={pipeline.data}
            selectedStatus={filterStatus}
            onFilterStatus={setFilterStatus}
          />
        )}

        <FlashList
          data={filteredData}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={queue.isRefetching || pipeline.isRefetching}
              onRefresh={handleRefresh}
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
                  pathname: '/(program-admin)/certifications/[id]',
                  params: { id: item.id, programId: programId ?? '' },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !queue.isLoading ? (
              queue.isError ? (
                <ErrorState onRetry={handleRefresh} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t('certifications.queue.emptyAdmin')}
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
