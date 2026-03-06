import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { StatCard } from '@/features/admin/components/StatCard';
import { useProgramAdminDashboard } from '@/features/admin/hooks/useProgramAdminDashboard';

export default function ProgramAdminDashboard() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
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
            iconColor={colors.accent.indigo}
            isLoading={dashboard.isLoading}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.programAdmin.dashboard.totalTeachers')}
            value={dashboard.data?.total_teachers ?? 0}
            icon="people-outline"
            iconColor={colors.accent.violet}
            isLoading={dashboard.isLoading}
          />
          <StatCard
            label={t('admin.programAdmin.dashboard.sessionsThisWeek')}
            value={dashboard.data?.sessions_this_week ?? 0}
            icon="calendar-outline"
            iconColor={colors.accent.sky}
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
});
