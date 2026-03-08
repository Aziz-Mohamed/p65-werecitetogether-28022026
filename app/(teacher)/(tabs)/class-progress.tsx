import React, { useState, useCallback, useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { LoadingState, ErrorState } from '@/components/feedback';

import { useTimePeriod } from '@/features/reports/hooks/useTimePeriod';
import { useTeacherClasses, useClassScoreTrend, useClassAttendanceTrend } from '@/features/reports/hooks/useTeacherReports';
import { useClassPulse } from '@/features/reports/hooks/useClassPulse';
import { useScoreDistribution, useLevelDistribution } from '@/features/reports/hooks/useAdminReports';
import { getTrendDirection, getScoreLabel } from '@/features/reports/utils/thresholds';
import type { InsightData } from '@/features/reports/types/reports.types';

import { TimePeriodFilter } from '@/features/reports/components/TimePeriodFilter';
import { ClassFilter } from '@/features/reports/components/ClassFilter';
import { PulseCard } from '@/features/reports/components/PulseCard';
import { ScoreSnapshotRow } from '@/features/reports/components/ScoreSnapshotRow';
import { InsightActionCard } from '@/features/reports/components/InsightActionCard';
import { StudentStatusGrid } from '@/features/reports/components/StudentStatusGrid';
import { MetricBottomSheet } from '@/features/reports/components/MetricBottomSheet';
import { AttendanceTrendChart } from '@/features/reports/components/AttendanceTrendChart';
import { ScoreTrendChart } from '@/features/reports/components/ScoreTrendChart';
import { ScoreDistributionChart } from '@/features/reports/components/ScoreDistributionChart';
import { LevelDistributionChart } from '@/features/reports/components/LevelDistributionChart';

type ActiveSheet = 'attendance' | 'scores' | 'engagement' | null;

export default function TeacherClassProgressScreen() {
  const { t } = useTranslation();
  const { profile, schoolId } = useAuth();
  const theme = useRoleTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { timePeriod, setTimePeriod, dateRange } = useTimePeriod();
  const [refreshing, setRefreshing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const teacherClasses = useTeacherClasses(profile?.id ?? null);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();

  // Auto-select first class when classes load
  React.useEffect(() => {
    if (teacherClasses.data && teacherClasses.data.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses.data[0].id);
    }
  }, [teacherClasses.data, selectedClassId]);

  const classId = selectedClassId ?? null;
  const classPulse = useClassPulse(schoolId, classId, dateRange);

  // Chart data hooks for bottom sheet drill-downs
  const attendanceTrend = useClassAttendanceTrend(schoolId, classId, dateRange);
  const scoreTrend = useClassScoreTrend(schoolId, classId, dateRange);
  const scoreDistribution = useScoreDistribution(schoolId, dateRange, classId ?? undefined);
  const levelDistribution = useLevelDistribution(schoolId, classId ?? undefined);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['teacher-reports'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    await queryClient.invalidateQueries({ queryKey: ['period-comparison'] });
    setRefreshing(false);
  }, [queryClient]);

  const pulse = classPulse.data;
  const analytics = classPulse.analytics;
  const comparison = classPulse.comparison;

  // Build plain-language class summary
  const classSummary = useMemo(() => {
    if (!pulse) return null;
    const attendance = pulse.attendance.displayValue;
    const scoreLabelKey = getScoreLabel(pulse.scores.value);
    const scoreWord = t(`insights.scoreLabel.${scoreLabelKey}`);
    const engagement = pulse.engagement.displayValue;
    return `${attendance} ${t('insights.metric.attendance').toLowerCase()} · ${t('insights.metric.avgScore')} ${pulse.scores.value.toFixed(1)}/5 (${scoreWord}) · ${engagement}`;
  }, [pulse, t]);

  // Reorder insights: celebrations first, then info, then warnings, then danger
  const orderedInsights = useMemo(() => {
    if (!pulse?.insights) return [];
    const order: Record<string, number> = { success: 0, info: 1, warning: 2, danger: 3 };
    return [...pulse.insights].sort(
      (a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2),
    );
  }, [pulse?.insights]);

  // Map insight IDs to appropriate bottom sheet or navigation
  const getInsightAction = useCallback((insight: InsightData) => {
    if (insight.actionRoute) return () => router.push(insight.actionRoute as any);
    switch (insight.id) {
      case 'attendance-drop':
      case 'attendance-up':
        return () => setActiveSheet('attendance');
      case 'declining-students':
      case 'low-score-students':
      case 'score-improved':
      case 'weakest-dimension':
      case 'top-performers':
        return () => setActiveSheet('scores');
      case 'engagement-drop':
      case 'engagement-surge':
        return () => setActiveSheet('engagement');
      default:
        return undefined;
    }
  }, [router]);

  // Score labels for ScoreSnapshotRow
  const memLabelKey = getScoreLabel(analytics?.averageMemorization ?? 0);
  const tajLabelKey = getScoreLabel(analytics?.averageTajweed ?? 0);
  const recLabelKey = getScoreLabel(analytics?.averageRecitation ?? 0);

  // Edge Case: teacher with zero classes
  if (teacherClasses.isLoading) return <LoadingState />;
  if (teacherClasses.isError) {
    return <ErrorState description={teacherClasses.error?.message} onRetry={() => teacherClasses.refetch()} />;
  }
  if (!teacherClasses.data || teacherClasses.data.length === 0) {
    return (
      <Screen scroll={false} hasTabBar>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('reports.noClassesAssigned')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      hasTabBar
      padding={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('reports.classProgress')}</Text>

        {/* Class selector (for teachers with multiple classes) */}
        {teacherClasses.data.length > 1 && (
          <View style={styles.filterRow}>
            <ClassFilter
              classes={teacherClasses.data}
              selectedClassId={selectedClassId}
              onSelect={(id) => setSelectedClassId(id ?? teacherClasses.data![0].id)}
              showAllOption={false}
            />
          </View>
        )}

        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />

        {/* Health Banner */}
        <View style={styles.section}>
          <PulseCard
            status={pulse?.status ?? 'green'}
            message={pulse?.message ?? t('insights.noData')}
            isLoading={classPulse.isLoading}
          />
        </View>

        {/* Class Summary — plain-language one-liner */}
        {classSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{classSummary}</Text>
          </View>
        )}

        {/* Score Snapshot — 3 animated rings with human labels */}
        <View style={styles.section}>
          <ScoreSnapshotRow
            memorization={analytics?.averageMemorization ?? 0}
            tajweed={analytics?.averageTajweed ?? 0}
            recitation={analytics?.averageRecitation ?? 0}
            memTrend={getTrendDirection(analytics?.averageMemorization ?? 0, comparison?.previousAvgMemorization ?? null, 0.1)}
            tajTrend={getTrendDirection(analytics?.averageTajweed ?? 0, comparison?.previousAvgTajweed ?? null, 0.1)}
            recTrend={getTrendDirection(analytics?.averageRecitation ?? 0, comparison?.previousAvgRecitation ?? null, 0.1)}
            memLabel={t(`insights.scoreLabel.${memLabelKey}`)}
            tajLabel={t(`insights.scoreLabel.${tajLabelKey}`)}
            recLabel={t(`insights.scoreLabel.${recLabelKey}`)}
            memLabelKey={memLabelKey}
            tajLabelKey={tajLabelKey}
            recLabelKey={recLabelKey}
            isLoading={classPulse.isLoading}
            onPress={() => setActiveSheet('scores')}
          />
        </View>

        {/* Insight Feed — tappable cards mapped to appropriate bottom sheets */}
        {orderedInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.actionItems')}</Text>
            {orderedInsights.map((insight) => (
              <View key={insight.id} style={styles.insightCardWrapper}>
                <InsightActionCard
                  insight={insight}
                  onPress={getInsightAction(insight)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Students at a Glance */}
        <View style={styles.section}>
          <StudentStatusGrid
            students={pulse?.students ?? []}
            onStudentPress={(id) => router.push(`/(teacher)/students/${id}` as any)}
            isLoading={classPulse.isLoading}
          />
        </View>
      </View>

      {/* Bottom Sheet: Attendance Trend */}
      <MetricBottomSheet
        title={t('insights.metric.attendance')}
        subtitle={pulse?.attendance.displayValue}
        isOpen={activeSheet === 'attendance'}
        onClose={() => setActiveSheet(null)}
      >
        <AttendanceTrendChart
          data={attendanceTrend.data ?? []}
          isLoading={attendanceTrend.isLoading}
        />
      </MetricBottomSheet>

      {/* Bottom Sheet: Score Trends */}
      <MetricBottomSheet
        title={t('insights.metric.scores')}
        subtitle={pulse?.scores.displayValue}
        isOpen={activeSheet === 'scores'}
        onClose={() => setActiveSheet(null)}
      >
        <ScoreTrendChart
          data={scoreTrend.data ?? []}
          isLoading={scoreTrend.isLoading}
        />
      </MetricBottomSheet>

      {/* Bottom Sheet: Engagement — Score & Level Distributions */}
      <MetricBottomSheet
        title={t('insights.metric.engagement')}
        subtitle={pulse?.engagement.displayValue}
        isOpen={activeSheet === 'engagement'}
        onClose={() => setActiveSheet(null)}
      >
        <ScoreDistributionChart
          data={scoreDistribution.data ?? []}
          isLoading={scoreDistribution.isLoading}
        />
        <View style={styles.chartSpacer} />
        <LevelDistributionChart
          data={levelDistribution.data ?? []}
          isLoading={levelDistribution.isLoading}
        />
      </MetricBottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
    marginBottom: spacing.md,
  },
  filterRow: {
    marginBottom: spacing.base,
  },
  section: {
    marginTop: spacing.base,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    marginBottom: spacing.md,
  },
  summaryContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: lightTheme.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  summaryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.base,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  chartSpacer: {
    height: spacing.lg,
  },
  insightCardWrapper: {
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
