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
import { useTeacherAttendanceKPIs } from '@/features/reports/hooks/useAdminReports';
import { TimePeriodFilter } from '@/features/reports/components/TimePeriodFilter';
import { PulseCard } from '@/features/reports/components/PulseCard';
import type { TeacherAttendanceKPI } from '@/features/reports/types/reports.types';

// ─── Teacher Attendance Report ───────────────────────────────────────────────

export default function TeacherAttendanceReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolId } = useAuth();
  const queryClient = useQueryClient();

  const { timePeriod, setTimePeriod, dateRange } = useTimePeriod();
  const [refreshing, setRefreshing] = useState(false);

  const { data: teachers = [], isLoading, isError, refetch } =
    useTeacherAttendanceKPIs(schoolId, dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports', 'teacher-attendance-kpis'] });
    setRefreshing(false);
  }, [queryClient]);

  // Summary KPIs
  const avgPunctuality = teachers.length > 0
    ? Math.round(teachers.reduce((sum, t) => sum + t.punctualityRate, 0) / teachers.length)
    : 0;
  const avgHours = teachers.length > 0
    ? (teachers.reduce((sum, t) => sum + t.avgHoursPerDay, 0) / teachers.length).toFixed(1)
    : '0';
  const totalPresent = teachers.reduce((sum, t) => sum + t.daysPresent, 0);

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
          {t('reports.teacherAttendanceReport.title')}
        </Text>

        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />

        {/* Insight Header */}
        {!isLoading && teachers.length > 0 && (
          <View style={{ marginBottom: spacing.base }}>
            <PulseCard
              status={avgPunctuality >= 90 ? 'green' : avgPunctuality >= 70 ? 'yellow' : 'red'}
              message={
                avgPunctuality >= 90
                  ? t('insights.punctualityStrong', { rate: avgPunctuality })
                  : t('insights.punctualityNeedsWork', {
                      rate: avgPunctuality,
                      lateCount: teachers.filter((tt) => tt.punctualityRate < 70).length,
                    })
              }
            />
          </View>
        )}

        {/* Summary KPIs */}
        <View style={styles.kpiRow}>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{avgPunctuality}%</Text>
            <Text style={styles.kpiLabel}>{t('reports.teacherAttendanceReport.avgPunctuality')}</Text>
          </Card>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{avgHours}h</Text>
            <Text style={styles.kpiLabel}>{t('reports.teacherAttendanceReport.avgHoursPerDay')}</Text>
          </Card>
          <Card variant="default" style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{totalPresent}</Text>
            <Text style={styles.kpiLabel}>{t('reports.teacherAttendanceReport.totalPresenceDays')}</Text>
          </Card>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState description={t('reports.errorMessage')} onRetry={refetch} />
        ) : teachers.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>
              {t('reports.teacherAttendanceReport.noData')}
            </Text>
          </Card>
        ) : (
          teachers.map((teacher) => (
            <Pressable
              key={teacher.teacherId}
              onPress={() => router.push(`/(master-admin)/teachers/${teacher.teacherId}` as any)}
            >
              <TeacherAttendanceCard teacher={teacher} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Teacher Card ────────────────────────────────────────────────────────────

function TeacherAttendanceCard({ teacher }: { teacher: TeacherAttendanceKPI }) {
  const { t } = useTranslation();

  const punctualityVariant = teacher.punctualityRate >= 90
    ? 'success' as const
    : teacher.punctualityRate >= 70
      ? 'warning' as const
      : 'error' as const;

  return (
    <Card variant="default" style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={20} color={colors.neutral[400]} />
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{teacher.fullName}</Text>
          <Badge
            label={`${teacher.punctualityRate}% ${t('reports.teacherAttendanceReport.onTime')}`}
            variant={punctualityVariant}
            size="sm"
          />
        </View>
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.neutral[300]} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.daysPresent}</Text>
          <Text style={styles.statLabel}>{t('reports.teacherAttendanceReport.daysPresent')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.daysOnTime}</Text>
          <Text style={styles.statLabel}>{t('reports.teacherAttendanceReport.daysOnTime')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.daysLate}</Text>
          <Text style={styles.statLabel}>{t('reports.teacherAttendanceReport.daysLate')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{teacher.totalHoursWorked.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>{t('reports.teacherAttendanceReport.totalHours')}</Text>
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
