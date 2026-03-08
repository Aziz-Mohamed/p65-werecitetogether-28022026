import React, { useState, useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';

import { useTimePeriod } from '@/features/reports/hooks/useTimePeriod';
import { useSchoolPulse } from '@/features/reports/hooks/useSchoolPulse';
import { getScoreLabel } from '@/features/reports/utils/thresholds';

import { TimePeriodFilter } from '@/features/reports/components/TimePeriodFilter';
import { SchoolPulseCard } from '@/features/reports/components/SchoolPulseCard';
import { PillarCard } from '@/features/reports/components/PillarCard';
import { InsightActionCard } from '@/features/reports/components/InsightActionCard';
import { QuickReportLink } from '@/features/reports/components/QuickReportLink';

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const { schoolId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { timePeriod, setTimePeriod, dateRange } = useTimePeriod();
  const [refreshing, setRefreshing] = useState(false);

  const schoolPulse = useSchoolPulse(schoolId, dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    await queryClient.invalidateQueries({ queryKey: ['period-comparison'] });
    setRefreshing(false);
  }, [queryClient]);

  const pulse = schoolPulse.data;

  // Reorder alerts: celebrations first, then info, warnings, danger
  const orderedAlerts = useMemo(() => {
    if (!pulse?.alerts) return [];
    const order: Record<string, number> = { success: 0, info: 1, warning: 2, danger: 3 };
    return [...pulse.alerts].sort(
      (a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2),
    );
  }, [pulse?.alerts]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <PageHeader title={t('reports.title')} />

        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />

        {/* Section 1: School Pulse Card */}
        <View style={styles.section}>
          <SchoolPulseCard
            status={pulse?.status ?? 'green'}
            message={pulse?.message ?? t('insights.noData')}
            isLoading={schoolPulse.isLoading}
          />
        </View>

        {/* Section 2: Three Pillar Cards */}
        {pulse && (
          <View style={styles.pillarsSection}>
            {/* Pillar 1: Student Health */}
            <PillarCard
              title={t('insights.pillar.studentHealth')}
              icon="people-outline"
              status={pulse.studentHealth.status}
              headline={t('insights.activeStudentsCount', { count: pulse.studentHealth.activeStudents })}
              metrics={[
                {
                  label: t('insights.metric.attendance'),
                  value: `${Math.round(pulse.studentHealth.attendanceRate)}%`,
                  trend: pulse.studentHealth.attendanceTrend,
                  trendLabel: pulse.studentHealth.attendanceTrendLabel,
                },
                {
                  label: t('insights.metric.avgScore'),
                  value: `${pulse.studentHealth.avgScore.toFixed(1)} ${t(`insights.scoreLabel.${getScoreLabel(pulse.studentHealth.avgScore)}`)}`,
                  trend: pulse.studentHealth.scoreTrend,
                  trendLabel: pulse.studentHealth.scoreTrendLabel,
                },
              ]}
            />

            {/* Pillar 2: Teacher Engagement */}
            <PillarCard
              title={t('insights.pillar.teacherEngagement')}
              icon="school-outline"
              status={pulse.teacherEngagement.status}
              headline={
                pulse.teacherEngagement.inactiveTeachers === 0
                  ? t('insights.allTeachersActive', { count: pulse.teacherEngagement.activeTeachers })
                  : t('insights.teachersInactivePillar', {
                      active: pulse.teacherEngagement.activeTeachers,
                      inactive: pulse.teacherEngagement.inactiveTeachers,
                    })
              }
              metrics={[
                {
                  label: t('insights.metric.sessionCompletion'),
                  value: `${pulse.teacherEngagement.sessionCompletionRate}%`,
                },
              ]}
              onPress={() => router.push('/(master-admin)/reports/teacher-activity')}
            />

            {/* Pillar 3: Academic Progress */}
            <PillarCard
              title={t('insights.pillar.academicProgress')}
              icon="book-outline"
              status={pulse.academicProgress.status}
              headline={t('insights.academicHeadline', {
                score: pulse.academicProgress.avgScore.toFixed(1),
                label: pulse.academicProgress.scoreLabel,
              })}
              metrics={[
                {
                  label: t('insights.metric.students'),
                  value: String(pulse.academicProgress.totalStudents),
                },
                {
                  label: t('insights.metric.stickers'),
                  value: String(pulse.academicProgress.stickersAwarded),
                },
              ]}
            />
          </View>
        )}

        {/* Section 3: Alerts & Actions */}
        {orderedAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('insights.alertsTitle')}</Text>
            {orderedAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertWrapper}>
                <InsightActionCard
                  insight={alert}
                  onPress={
                    alert.actionRoute
                      ? () => router.push(alert.actionRoute as any)
                      : undefined
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* Section 4: Quick Report Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('insights.detailedReports')}</Text>
          <View style={styles.linksGrid}>
            <QuickReportLink
              title={t('reports.teacherActivity')}
              icon="people-outline"
              metricLabel={
                pulse
                  ? t('insights.teacherActiveCount', {
                      active: pulse.teacherEngagement.activeTeachers,
                      total: pulse.teacherEngagement.activeTeachers + pulse.teacherEngagement.inactiveTeachers,
                    })
                  : '--'
              }
              onPress={() => router.push('/(master-admin)/reports/teacher-activity')}
            />
            <QuickReportLink
              title={t('reports.teacherAttendanceReport.title')}
              icon="time-outline"
              metricLabel={t('insights.viewDetails')}
              onPress={() => router.push('/(master-admin)/reports/teacher-attendance')}
            />
            <QuickReportLink
              title={t('reports.sessionCompletion.title')}
              icon="checkmark-done-outline"
              metricLabel={
                pulse
                  ? `${pulse.teacherEngagement.sessionCompletionRate}% ${t('insights.completionRate')}`
                  : '--'
              }
              onPress={() => router.push('/(master-admin)/reports/session-completion')}
            />
            <QuickReportLink
              title={t('reports.memorization.title')}
              icon="book-outline"
              metricLabel={t('insights.viewDetails')}
              onPress={() => router.push('/(master-admin)/reports/memorization')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  section: {
    marginTop: spacing.lg,
  },
  pillarsSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.textSecondary,
    marginBottom: spacing.md,
  },
  alertWrapper: {
    marginBottom: spacing.sm,
  },
  linksGrid: {
    gap: spacing.sm,
  },
});
