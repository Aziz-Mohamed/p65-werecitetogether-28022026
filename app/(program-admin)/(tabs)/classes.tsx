import React from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { programsService } from '@/features/programs/services/programs.service';
import type { ProgramClassWithTeacher } from '@/features/programs/types/programs.types';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { useRTL } from '@/hooks/useRTL';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
  enrollment_open: 'success',
  in_progress: 'info',
  enrollment_closed: 'warning',
  completed: 'default',
  archived: 'default',
};

export default function ProgramAdminClasses() {
  const { t, i18n } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const router = useRouter();

  const classes = useQuery({
    queryKey: ['programs', programId, 'classes'],
    queryFn: async () => {
      const { data, error } = await programsService.getProgramClasses({ programId: programId! });
      if (error) throw error;
      return (data as unknown as ProgramClassWithTeacher[]) ?? [];
    },
    enabled: !!programId,
  });

  if (!programId) {
    return (
      <Screen>
        <EmptyState
          icon="school-outline"
          title={t('admin.programAdmin.selectProgram')}
          description={t('admin.programAdmin.selectProgramDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.programAdmin.classes.title')}</Text>

        <FlashList
          data={classes.data ?? []}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={classes.isRefetching} onRefresh={() => classes.refetch()} />
          }
          renderItem={({ item }) => {
            const enrolled = item.enrollments?.[0]?.count ?? 0;
            return (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
                  <Badge
                    label={item.status.replace('_', ' ')}
                    variant={statusVariant[item.status] ?? 'default'}
                    size="sm"
                  />
                </View>
                <Text style={styles.classDetail}>
                  {t('admin.programAdmin.classes.enrolled', { current: enrolled, max: item.max_students })}
                </Text>
                {item.profiles && (
                  <Text style={styles.classTeacher}>
                    {t('common.teacher')}: {item.profiles.full_name}
                  </Text>
                )}
                {item.start_date && (
                  <Text style={styles.classDate}>
                    {new Date(item.start_date).toLocaleDateString()}
                  </Text>
                )}
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !classes.isLoading ? (
              classes.isError ? (
                <ErrorState onRetry={() => classes.refetch()} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('admin.programAdmin.classes.empty')}</Text>
                </View>
              )
            ) : null
          }
        />

        <Pressable
          style={styles.fab}
          onPress={() =>
            router.push({
              pathname: '/(program-admin)/programs/[id]/classes/create',
              params: { id: programId! },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={t('admin.programAdmin.classes.createClass')}
        >
          <Ionicons name="add" size={normalize(28)} color="#fff" />
        </Pressable>
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
  card: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  className: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  classDetail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  classTeacher: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  classDate: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
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
  fab: {
    position: 'absolute',
    bottom: spacing['3xl'],
    right: spacing.base,
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
  },
});
