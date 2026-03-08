import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CartesianChart, Bar } from 'victory-native';

import { Screen } from '@/components/layout';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';

export default function SupervisorReports() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const teachers = useSupervisedTeachers(userId);

  const sessionsData = (teachers.data ?? []).map((teacher, i) => ({
    x: i,
    y: teacher.sessions_this_week,
    label: teacher.full_name,
  }));

  const ratingsData = (teachers.data ?? [])
    .filter((teacher) => teacher.average_rating != null)
    .map((teacher, i) => ({
      x: i,
      y: teacher.average_rating ?? 0,
      label: teacher.full_name,
    }));

  const inactiveTeachers = (teachers.data ?? []).filter((t) => !t.is_active);

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={teachers.isRefetching} onRefresh={() => teachers.refetch()} />
        }
      >
        <Text style={styles.title}>{t('admin.supervisor.reports.title')}</Text>

        {/* Sessions Per Teacher */}
        <Text style={styles.sectionTitle}>{t('admin.supervisor.reports.sessionsPerTeacher')}</Text>
        <View style={styles.chartContainer}>
          {sessionsData.length > 0 ? (
            <CartesianChart
              data={sessionsData}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 20, right: 20 }}
            >
              {({ points, chartBounds }) => (
                <Bar
                  points={points.y}
                  chartBounds={chartBounds}
                  color={colors.primary[500]}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                />
              )}
            </CartesianChart>
          ) : (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>
        {sessionsData.length > 0 && (
          <View style={styles.legendContainer}>
            {sessionsData.map((d, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary[500] }]} />
                <Text style={styles.legendText} numberOfLines={1}>{d.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Student Distribution */}
        <Text style={styles.sectionTitle}>{t('admin.supervisor.reports.studentDistribution')}</Text>
        <View style={styles.listContainer}>
          {(teachers.data ?? []).map((teacher) => (
            <View key={teacher.teacher_id} style={styles.distRow}>
              <Text style={styles.distName} numberOfLines={1}>{teacher.full_name}</Text>
              <Text style={styles.distValue}>{teacher.student_count}</Text>
            </View>
          ))}
          {(teachers.data ?? []).length === 0 && (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>

        {/* Average Rating Per Teacher */}
        <Text style={styles.sectionTitle}>{t('admin.supervisor.reports.averageRating')}</Text>
        <View style={styles.chartContainer}>
          {ratingsData.length > 0 ? (
            <CartesianChart
              data={ratingsData}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 20, right: 20 }}
            >
              {({ points, chartBounds }) => (
                <Bar
                  points={points.y}
                  chartBounds={chartBounds}
                  color={colors.secondary[500]}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                />
              )}
            </CartesianChart>
          ) : (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>
        {ratingsData.length > 0 && (
          <View style={styles.legendContainer}>
            {ratingsData.map((d, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.secondary[500] }]} />
                <Text style={styles.legendText} numberOfLines={1}>{d.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Inactive Teacher Alerts */}
        <Text style={styles.sectionTitle}>{t('admin.supervisor.reports.inactiveTeachers')}</Text>
        <View style={styles.listContainer}>
          {inactiveTeachers.length > 0 ? (
            inactiveTeachers.map((teacher) => (
              <View key={teacher.teacher_id} style={styles.distRow}>
                <Text style={styles.distName} numberOfLines={1}>{teacher.full_name}</Text>
                <Badge label={t('admin.supervisor.inactiveFlag')} variant="warning" size="sm" />
              </View>
            ))
          ) : (
            <Text style={styles.noData}>{t('admin.supervisor.reports.noInactiveTeachers')}</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.xl, paddingBottom: spacing['3xl'] },
  title: { ...typography.textStyles.heading, color: lightTheme.text, paddingHorizontal: spacing.base, marginBottom: spacing.base },
  sectionTitle: { ...typography.textStyles.subheading, color: lightTheme.text, paddingHorizontal: spacing.base, marginTop: spacing.xl, marginBottom: spacing.sm },
  chartContainer: {
    height: normalize(200),
    marginHorizontal: spacing.base,
    backgroundColor: lightTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  listContainer: {
    marginHorizontal: spacing.base,
    backgroundColor: lightTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    padding: spacing.sm,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  distName: { ...typography.textStyles.body, color: lightTheme.text, flex: 1 },
  distValue: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  noData: { ...typography.textStyles.body, color: lightTheme.textSecondary, textAlign: 'center' },
  legendContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  legendText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    maxWidth: normalize(100),
  },
});
