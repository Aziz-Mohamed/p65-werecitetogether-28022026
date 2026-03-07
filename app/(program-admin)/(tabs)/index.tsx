import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { StatCard } from '@/features/admin/components/StatCard';
import { ProgramSelector } from '@/features/admin/components/ProgramSelector';
import { useProgramAdminDashboard } from '@/features/admin/hooks/useProgramAdminDashboard';
import { useProgramAdminPrograms } from '@/features/admin/hooks/useProgramAdminPrograms';
import { useAuth } from '@/hooks/useAuth';

export default function ProgramAdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();

  if (!programId) {
    return <ProgramSelectorView />;
  }

  return <DashboardView programId={programId} />;
}

function ProgramSelectorView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: programs, isLoading } = useProgramAdminPrograms(userId);

  if (!isLoading && (programs ?? []).length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="folder-open-outline"
          title={t('admin.programAdmin.selector.empty')}
          description={t('admin.programAdmin.selector.emptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding={false}>
      <ProgramSelector
        programs={programs ?? []}
        isLoading={isLoading}
        onSelect={(selectedProgramId) => {
          router.replace({
            pathname: '/(program-admin)/(tabs)',
            params: { programId: selectedProgramId },
          });
        }}
      />
    </Screen>
  );
}

function DashboardView({ programId }: { programId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const dashboard = useProgramAdminDashboard(programId);

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()} />
        }
      >
        <Text style={styles.title}>{t('admin.programAdmin.dashboard.title')}</Text>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.programAdmin.dashboard.totalEnrolled')}
            value={dashboard.data?.total_enrolled ?? 0}
            icon="school-outline"
            iconColor={colors.primary[500]}
            isLoading={dashboard.isLoading}
          />
          <StatCard
            label={t('admin.programAdmin.dashboard.activeCohorts')}
            value={dashboard.data?.active_cohorts ?? 0}
            icon="people-circle-outline"
            iconColor={colors.accent.indigo[500]}
            isLoading={dashboard.isLoading}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.programAdmin.dashboard.totalTeachers')}
            value={dashboard.data?.total_teachers ?? 0}
            icon="people-outline"
            iconColor={colors.accent.violet[500]}
            isLoading={dashboard.isLoading}
          />
          <StatCard
            label={t('admin.programAdmin.dashboard.sessionsThisWeek')}
            value={dashboard.data?.sessions_this_week ?? 0}
            icon="calendar-outline"
            iconColor={colors.accent.sky[500]}
            isLoading={dashboard.isLoading}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.programAdmin.dashboard.pendingEnrollments')}
            value={dashboard.data?.pending_enrollments ?? 0}
            icon="time-outline"
            iconColor={colors.secondary[500]}
            isLoading={dashboard.isLoading}
          />
        </View>

        {(dashboard.data?.pending_enrollments ?? 0) > 0 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              {t('admin.programAdmin.dashboard.pendingWarning', {
                count: dashboard.data?.pending_enrollments ?? 0,
              })}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <Card
          variant="default"
          style={styles.quickAction}
          onPress={() => router.push('/(program-admin)/rewards')}
        >
          <View style={styles.quickActionRow}>
            <Ionicons name="gift-outline" size={20} color={colors.secondary[500]} />
            <Text style={styles.quickActionText}>{t('gamification.rewardsDashboard.title')}</Text>
            <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  warningBanner: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    backgroundColor: colors.secondary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    padding: spacing.md,
  },
  warningText: {
    ...typography.textStyles.body,
    color: colors.secondary[700],
    textAlign: 'center',
  },
  quickAction: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
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
