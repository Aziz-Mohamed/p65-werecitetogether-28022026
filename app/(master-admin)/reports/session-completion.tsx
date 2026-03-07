import React, { useState, useCallback } from 'react';
import { I18nManager, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { lightTheme, colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

import { useTimePeriod } from '@/features/reports/hooks/useTimePeriod';
import { useSessionCompletionStats } from '@/features/reports/hooks/useAdminReports';
import { TimePeriodFilter } from '@/features/reports/components/TimePeriodFilter';
import { PulseCard } from '@/features/reports/components/PulseCard';
import type { SessionCompletionStat } from '@/features/reports/types/reports.types';

// ─── Session Completion Report ───────────────────────────────────────────────

export default function SessionCompletionReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolId } = useAuth();
  const queryClient = useQueryClient();

  const { timePeriod, setTimePeriod, dateRange } = useTimePeriod();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats = [], isLoading, isError, refetch } =
    useSessionCompletionStats(schoolId, dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports', 'session-completion'] });
    setRefreshing(false);
  }, [queryClient]);

  // Summary KPIs
  const totalScheduled = stats.reduce((sum, s) => sum + s.totalScheduled, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completedCount, 0);
  const totalMissed = stats.reduce((sum, s) => sum + s.missedCount, 0);
  const overallRate = totalScheduled > 0
    ? Math.round((totalCompleted / (totalCompleted + totalMissed || 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>
          {t('reports.sessionCompletion.title')}
        </Text>

        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />

        {/* Insight Header */}
        {!isLoading && stats.length > 0 && (
          <View style={{ marginBottom: spacing.base }}>
            <PulseCard
              status={overallRate >= 90 ? 'green' : overallRate >= 75 ? 'yellow' : 'red'}
              message={
                overallRate >= 90
                  ? t('insights.sessionCompletionStrong', { rate: overallRate })
                  : t('insights.sessionCompletionLow', {
                      rate: overallRate,
                      count: stats.filter((s) => s.completionRate < 70).length,
                    })
              }
            />
          </View>
        )}

        {/* Summary KPIs */}
        <View style={styles.kpiRow}>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{overallRate}%</Text>
            <Text style={styles.kpiLabel}>{t('reports.sessionCompletion.completionRate')}</Text>
          </Card>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalCompleted}</Text>
            <Text style={styles.kpiLabel}>{t('reports.sessionCompletion.completed')}</Text>
          </Card>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalMissed}</Text>
            <Text style={styles.kpiLabel}>{t('reports.sessionCompletion.missed')}</Text>
          </Card>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState description={t('reports.errorMessage')} onRetry={refetch} />
        ) : stats.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={40} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>
              {t('reports.sessionCompletion.noData')}
            </Text>
          </Card>
        ) : (
          stats.map((stat) => (
            <Pressable
              key={stat.teacherId}
              onPress={() => router.push(`/(master-admin)/teachers/${stat.teacherId}` as any)}
            >
              <SessionCompletionCard stat={stat} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Teacher Completion Card ─────────────────────────────────────────────────

function SessionCompletionCard({ stat }: { stat: SessionCompletionStat }) {
  const { t } = useTranslation();

  const rateVariant = stat.completionRate >= 90
    ? 'success' as const
    : stat.completionRate >= 70
      ? 'warning' as const
      : 'error' as const;

  return (
    <Card variant="default" style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={20} color={colors.neutral[400]} />
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{stat.fullName}</Text>
          <Badge
            label={`${stat.completionRate}%`}
            variant={rateVariant}
            size="sm"
          />
        </View>
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.neutral[300]} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stat.totalScheduled}</Text>
          <Text style={styles.statLabel}>{t('reports.sessionCompletion.scheduled')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent.emerald[600] }]}>
            {stat.completedCount}
          </Text>
          <Text style={styles.statLabel}>{t('reports.sessionCompletion.completed')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent.rose[600] }]}>
            {stat.missedCount}
          </Text>
          <Text style={styles.statLabel}>{t('reports.sessionCompletion.missed')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.neutral[500] }]}>
            {stat.cancelledCount}
          </Text>
          <Text style={styles.statLabel}>{t('reports.sessionCompletion.cancelled')}</Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBottom: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiValue: {
    ...typography.textStyles.heading,
    color: colors.primary[600],
    fontSize: typography.fontSize.xl,
  },
  kpiLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginTop: normalize(2),
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  teacherCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  statLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginTop: normalize(2),
    fontSize: typography.fontSize.xs,
  },
});
