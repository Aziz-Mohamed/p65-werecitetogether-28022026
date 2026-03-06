import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CertificationCard } from '@/features/certifications/components/CertificationCard';
import { certificationsService } from '@/features/certifications/services/certifications.service';

export default function TeacherCertificationsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ['certifications', 'teacher', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await certificationsService.getTeacherCertifications(userId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('certifications.teacher.title')}</Text>
        <FlashList
          data={data ?? []}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <CertificationCard
              id={item.id}
              studentName={(item as Record<string, unknown>).student
                ? ((item as Record<string, unknown>).student as { full_name: string }).full_name
                : ''}
              programName={(item as Record<string, unknown>).program
                ? ((item as Record<string, unknown>).program as { name: string }).name
                : ''}
              trackName={(item as Record<string, unknown>).track
                ? ((item as Record<string, unknown>).track as { name: string }).name
                : null}
              type={item.type as 'ijazah' | 'graduation' | 'completion'}
              status={item.status as 'recommended' | 'supervisor_approved' | 'issued' | 'returned' | 'rejected' | 'revoked'}
              title={item.title}
              createdAt={item.created_at}
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/certifications/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !isLoading ? (
              isError ? (
                <ErrorState onRetry={refetch} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('certifications.teacher.empty')}</Text>
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
