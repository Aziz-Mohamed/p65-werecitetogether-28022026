import React, { useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';

import { useTimePeriod } from '@/features/reports/hooks/useTimePeriod';
import { useTeacherActivity } from '@/features/reports/hooks/useAdminReports';
import { TimePeriodFilter } from '@/features/reports/components/TimePeriodFilter';
import { TeacherActivityList } from '@/features/reports/components/TeacherActivityList';
import { PulseCard } from '@/features/reports/components/PulseCard';

export default function TeacherActivityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolId } = useAuth();
  const queryClient = useQueryClient();

  const { timePeriod, setTimePeriod, dateRange } = useTimePeriod();
  const [refreshing, setRefreshing] = useState(false);

  const teacherActivity = useTeacherActivity(schoolId, dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports', 'teacher-activity'] });
    setRefreshing(false);
  }, [queryClient]);

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
          {t('reports.teacherActivity')}
        </Text>

        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />

        {/* Insight Header */}
        {!teacherActivity.isLoading && teacherActivity.data && (
          <View style={{ marginBottom: spacing.base }}>
            <PulseCard
              status={
                teacherActivity.data.every((ta) => ta.sessionsLogged > 0)
                  ? 'green'
                  : teacherActivity.data.filter((ta) => ta.sessionsLogged === 0).length <= 1
                    ? 'yellow'
                    : 'red'
              }
              message={
                teacherActivity.data.every((ta) => ta.sessionsLogged > 0)
                  ? t('insights.allTeachersActiveDetail', { count: teacherActivity.data.length })
                  : t('insights.teachersInactiveDetail', {
                      count: teacherActivity.data.filter((ta) => ta.sessionsLogged === 0).length,
                      total: teacherActivity.data.length,
                    })
              }
            />
          </View>
        )}

        <TeacherActivityList
          teachers={teacherActivity.data ?? []}
          isLoading={teacherActivity.isLoading}
          isError={teacherActivity.isError}
          onRetry={() => teacherActivity.refetch()}
          onTeacherPress={(id) => router.push(`/(master-admin)/teachers/${id}` as any)}
        />
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
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBottom: spacing.sm,
  },
});
