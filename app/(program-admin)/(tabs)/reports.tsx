import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CartesianChart, Bar, Line } from 'victory-native';

import { Screen } from '@/components/layout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { useProgramReports } from '@/features/admin/hooks/useProgramReports';

export default function ProgramAdminReports() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { sessionTrend, teacherWorkload } = useProgramReports(programId);

  if (!programId) {
    return (
      <Screen>
        <EmptyState
          icon="bar-chart-outline"
          title={t('admin.programAdmin.selectProgram')}
          description={t('admin.programAdmin.selectProgramDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={sessionTrend.isRefetching || teacherWorkload.isRefetching}
            onRefresh={() => { sessionTrend.refetch(); teacherWorkload.refetch(); }}
          />
        }
      >
        <Text style={styles.title}>{t('admin.programAdmin.reports.title')}</Text>

        {/* Teacher Workload Bar Chart */}
        <Text style={styles.sectionTitle}>{t('admin.programAdmin.reports.teacherWorkload')}</Text>
        <View style={styles.chartContainer}>
          {teacherWorkload.data && teacherWorkload.data.length > 0 ? (
            <CartesianChart
              data={teacherWorkload.data.map((d, i) => ({ x: i, y: d.session_count, label: d.full_name }))}
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

        {/* Session Trend Line Chart */}
        <Text style={styles.sectionTitle}>{t('admin.programAdmin.reports.sessionTrend')}</Text>
        <View style={styles.chartContainer}>
          {sessionTrend.data && sessionTrend.data.length > 0 ? (
            <CartesianChart
              data={sessionTrend.data.map((d, i) => ({ x: i, y: d.count }))}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 10, right: 10 }}
            >
              {({ points }) => (
                <Line
                  points={points.y}
                  color={colors.accent.indigo}
                  strokeWidth={2}
                  curveType="natural"
                />
              )}
            </CartesianChart>
          ) : (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>
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
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
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
  noData: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
