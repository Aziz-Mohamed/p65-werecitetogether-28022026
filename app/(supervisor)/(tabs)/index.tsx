import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

import { StatCard } from '@/features/admin/components/StatCard';
import { TeacherCard } from '@/features/admin/components/TeacherCard';
import { useSupervisorDashboard } from '@/features/admin/hooks/useSupervisorDashboard';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';

export default function SupervisorHome() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const dashboard = useSupervisorDashboard(userId);
  const teachers = useSupervisedTeachers(userId);

  const isLoading = dashboard.isLoading || teachers.isLoading;
  const isRefreshing = dashboard.isRefetching || teachers.isRefetching;

  const handleRefresh = () => {
    dashboard.refetch();
    teachers.refetch();
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <FlashList
          data={teachers.data ?? []}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <Text style={styles.title}>{t('admin.supervisor.title')}</Text>

              <View style={styles.statsRow}>
                <StatCard
                  label={t('admin.supervisor.teacherCount')}
                  value={dashboard.data?.teacher_count ?? 0}
                  icon="people-outline"
                  iconColor={colors.primary[500]}
                  isLoading={isLoading}
                />
                <StatCard
                  label={t('admin.supervisor.studentCount')}
                  value={dashboard.data?.student_count ?? 0}
                  icon="school-outline"
                  iconColor={colors.accent.indigo}
                  isLoading={isLoading}
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label={t('admin.supervisor.sessionsThisWeek')}
                  value={dashboard.data?.sessions_this_week ?? 0}
                  icon="calendar-outline"
                  iconColor={colors.accent.violet}
                  isLoading={isLoading}
                />
              </View>

              <Card
                variant="default"
                style={styles.quickAction}
                onPress={() => router.push('/(supervisor)/rewards')}
              >
                <View style={styles.quickActionRow}>
                  <Ionicons name="gift-outline" size={20} color={colors.secondary[500]} />
                  <Text style={styles.quickActionText}>{t('gamification.rewardsDashboard.title')}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
                </View>
              </Card>
            </View>
          }
          renderItem={({ item }) => (
            <TeacherCard
              teacher={item}
              onPress={() =>
                router.push({
                  pathname: '/(supervisor)/teachers/[id]',
                  params: { id: item.teacher_id, programId: item.program_id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !isLoading ? (
              dashboard.isError || teachers.isError ? (
                <ErrorState onRetry={handleRefresh} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t('admin.supervisor.teacherList.empty')}
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
  },
  headerSection: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  quickAction: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickActionText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
});
