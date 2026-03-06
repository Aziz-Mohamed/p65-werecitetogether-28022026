import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CartesianChart, Line, Bar } from 'victory-native';

import { Screen } from '@/components/layout';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { useMasterAdminReports } from '@/features/admin/hooks/useMasterAdminReports';

export default function MasterAdminReports() {
  const { t } = useTranslation();
  const router = useRouter();
  const { enrollmentTrend, sessionVolume, teacherHeatmap } = useMasterAdminReports();

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={enrollmentTrend.isRefetching || sessionVolume.isRefetching || teacherHeatmap.isRefetching}
            onRefresh={() => { enrollmentTrend.refetch(); sessionVolume.refetch(); teacherHeatmap.refetch(); }}
          />
        }
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('admin.masterAdmin.reports.title')}</Text>

        {/* Enrollment Trend */}
        <Text style={styles.sectionTitle}>{t('admin.masterAdmin.reports.enrollmentTrend')}</Text>
        <View style={styles.chartContainer}>
          {enrollmentTrend.data && enrollmentTrend.data.length > 0 ? (
            <CartesianChart
              data={enrollmentTrend.data.map((d, i) => ({ x: i, y: d.count }))}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 10, right: 10 }}
            >
              {({ points }) => (
                <Line points={points.y} color={colors.primary[500]} strokeWidth={2} curveType="natural" />
              )}
            </CartesianChart>
          ) : (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>

        {/* Session Volume */}
        <Text style={styles.sectionTitle}>{t('admin.masterAdmin.reports.sessionVolume')}</Text>
        <View style={styles.chartContainer}>
          {sessionVolume.data && sessionVolume.data.length > 0 ? (
            <CartesianChart
              data={sessionVolume.data.map((d, i) => ({ x: i, y: d.count }))}
              xKey="x"
              yKeys={['y']}
              domainPadding={{ left: 20, right: 20 }}
            >
              {({ points, chartBounds }) => (
                <Bar points={points.y} chartBounds={chartBounds} color={colors.accent.indigo} roundedCorners={{ topLeft: 4, topRight: 4 }} />
              )}
            </CartesianChart>
          ) : (
            <Text style={styles.noData}>{t('common.noResults')}</Text>
          )}
        </View>

        {/* Teacher Activity Heatmap */}
        <Text style={styles.sectionTitle}>{t('admin.masterAdmin.reports.teacherActivity')}</Text>
        <View style={styles.heatmapContainer}>
          {teacherHeatmap.data && teacherHeatmap.data.length > 0 ? (
            <View style={styles.heatmapGrid}>
              {Array.from(new Set(teacherHeatmap.data.map((d) => d.teacher_id))).slice(0, 10).map((teacherId) => {
                const entries = teacherHeatmap.data!.filter((d) => d.teacher_id === teacherId);
                return (
                  <View key={teacherId} style={styles.heatmapRow}>
                    {entries.slice(0, 28).map((entry, i) => (
                      <View
                        key={i}
                        style={[
                          styles.heatmapCell,
                          {
                            backgroundColor:
                              entry.session_count === 0
                                ? lightTheme.border
                                : entry.session_count <= 2
                                  ? colors.primary[100]
                                  : entry.session_count <= 5
                                    ? colors.primary[300]
                                    : colors.primary[500],
                          },
                        ]}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
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
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[500],
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
  heatmapContainer: {
    marginHorizontal: spacing.base,
    backgroundColor: lightTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    padding: spacing.sm,
    minHeight: normalize(100),
    justifyContent: 'center',
  },
  heatmapGrid: {
    gap: 2,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapCell: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: 2,
  },
  noData: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
