import React, { useState, useCallback } from 'react';
import { I18nManager, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { spacing } from '@/theme/spacing';
import { lightTheme, colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { supabase } from '@/lib/supabase';
import { TOTAL_QURAN_AYAHS } from '@/lib/quran-metadata';
import { PulseCard } from '@/features/reports/components/PulseCard';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentMemSummary {
  student_id: string;
  full_name: string;
  name_localized: Record<string, string> | null;
  class_name: string | null;
  class_name_localized: Record<string, string> | null;
  total_memorized: number;
  total_in_progress: number;
  items_needing_review: number;
  total_recitations: number;
  quran_percentage: number;
  avg_accuracy: number | null;
}

interface SchoolMemKPIs {
  totalStudentsWithProgress: number;
  totalAyahsMemorized: number;
  totalRecitations: number;
  avgQuranPercentage: number;
  studentsNeedingReview: number;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useSchoolMemorizationReport(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['admin-reports', 'memorization', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('School ID required');

      // Get all students with their memorization progress summary
      const { data: students, error: studErr } = await supabase
        .from('students')
        .select('id, profiles!inner(full_name, name_localized), classes(name, name_localized)')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (studErr) throw studErr;

      const summaries: StudentMemSummary[] = [];

      for (const student of students ?? []) {
        // Get progress summary for each student
        const { data: progress } = await supabase
          .from('memorization_progress')
          .select('status, from_ayah, to_ayah')
          .eq('student_id', student.id);

        const { count: recitationCount } = await supabase
          .from('recitations')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.id);

        if (!progress || progress.length === 0) continue;

        let memorized = 0;
        let inProgress = 0;
        let needsReview = 0;

        for (const p of progress) {
          const ayahCount = p.to_ayah - p.from_ayah + 1;
          if (p.status === 'memorized') memorized += ayahCount;
          else if (p.status === 'learning' || p.status === 'new') inProgress += ayahCount;
          if (p.status === 'needs_review') needsReview++;
        }

        const { data: avgData } = await supabase
          .from('memorization_progress')
          .select('avg_accuracy')
          .eq('student_id', student.id)
          .not('avg_accuracy', 'is', null);

        const avgAccuracy =
          avgData && avgData.length > 0
            ? avgData.reduce((sum, r) => sum + (r.avg_accuracy ?? 0), 0) / avgData.length
            : null;

        const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;
        const classInfo = Array.isArray(student.classes) ? student.classes[0] : student.classes;

        summaries.push({
          student_id: student.id,
          full_name: (profile as { full_name: string })?.full_name ?? 'Unknown',
          name_localized: (profile as { name_localized: Record<string, string> | null })?.name_localized ?? null,
          class_name: (classInfo as { name: string })?.name ?? null,
          class_name_localized: (classInfo as { name_localized: Record<string, string> | null })?.name_localized ?? null,
          total_memorized: memorized,
          total_in_progress: inProgress,
          items_needing_review: needsReview,
          total_recitations: recitationCount ?? 0,
          quran_percentage: (memorized / TOTAL_QURAN_AYAHS) * 100,
          avg_accuracy: avgAccuracy,
        });
      }

      // Sort by most progress first
      summaries.sort((a, b) => b.total_memorized - a.total_memorized);

      // Calculate KPIs
      const kpis: SchoolMemKPIs = {
        totalStudentsWithProgress: summaries.length,
        totalAyahsMemorized: summaries.reduce((sum, s) => sum + s.total_memorized, 0),
        totalRecitations: summaries.reduce((sum, s) => sum + s.total_recitations, 0),
        avgQuranPercentage:
          summaries.length > 0
            ? summaries.reduce((sum, s) => sum + s.quran_percentage, 0) / summaries.length
            : 0,
        studentsNeedingReview: summaries.filter((s) => s.items_needing_review > 0).length,
      };

      return { summaries, kpis };
    },
    enabled: !!schoolId,
  });
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function MemorizationReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolId } = useAuth();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, isError, refetch } = useSchoolMemorizationReport(schoolId ?? undefined);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports', 'memorization'] });
    setRefreshing(false);
  }, [queryClient]);

  const kpis = data?.kpis;
  const summaries = data?.summaries ?? [];

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
          {t('reports.memorization.title')}
        </Text>

        {/* Insight Header */}
        {!isLoading && kpis && (
          <View style={{ marginBottom: spacing.base }}>
            <PulseCard
              status={
                kpis.studentsNeedingReview === 0
                  ? 'green'
                  : kpis.studentsNeedingReview <= 3
                    ? 'yellow'
                    : 'red'
              }
              message={
                kpis.studentsNeedingReview === 0
                  ? t('insights.memorizationHealthy', {
                      count: kpis.totalStudentsWithProgress,
                      ayahs: kpis.totalAyahsMemorized,
                    })
                  : t('insights.memorizationNeedsReview', {
                      count: kpis.studentsNeedingReview,
                      total: kpis.totalStudentsWithProgress,
                    })
              }
            />
          </View>
        )}

        {/* Summary KPIs */}
        {kpis && (
          <>
            <View style={styles.kpiRow}>
              <Card variant="default" style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{kpis.totalStudentsWithProgress}</Text>
                <Text style={styles.kpiLabel}>
                  {t('reports.memorization.studentsTracked')}
                </Text>
              </Card>
              <Card variant="default" style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {kpis.totalAyahsMemorized.toLocaleString()}
                </Text>
                <Text style={styles.kpiLabel}>
                  {t('reports.memorization.totalAyahs')}
                </Text>
              </Card>
              <Card variant="default" style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{kpis.totalRecitations}</Text>
                <Text style={styles.kpiLabel}>
                  {t('reports.memorization.totalRecitations')}
                </Text>
              </Card>
            </View>

            <View style={styles.kpiRow}>
              <Card variant="default" style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {kpis.avgQuranPercentage.toFixed(1)}%
                </Text>
                <Text style={styles.kpiLabel}>
                  {t('reports.memorization.avgProgress')}
                </Text>
              </Card>
              <Card variant="default" style={styles.kpiCard}>
                <Text style={[styles.kpiValue, kpis.studentsNeedingReview > 0 && { color: colors.semantic.warning }]}>
                  {kpis.studentsNeedingReview}
                </Text>
                <Text style={styles.kpiLabel}>
                  {t('reports.memorization.needReview')}
                </Text>
              </Card>
            </View>
          </>
        )}

        {/* Student List */}
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState description={t('reports.errorMessage')} onRetry={refetch} />
        ) : summaries.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons name="book-outline" size={40} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>
              {t('reports.memorization.noData')}
            </Text>
          </Card>
        ) : (
          summaries.map((student) => (
            <Pressable
              key={student.student_id}
              onPress={() => router.push(`/(master-admin)/students/${student.student_id}` as any)}
            >
              <StudentMemCard student={student} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Student Card ───────────────────────────────────────────────────────────

function StudentMemCard({ student }: { student: StudentMemSummary }) {
  const { t } = useTranslation();
  const { resolveName } = useLocalizedName();
  const progress = student.quran_percentage / 100;

  return (
    <Card variant="default" style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={20} color={colors.neutral[400]} />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{resolveName(student.name_localized, student.full_name)}</Text>
          {student.class_name && (
            <Text style={styles.className}>{resolveName(student.class_name_localized, student.class_name)}</Text>
          )}
        </View>
        <Text style={styles.percentage}>{student.quran_percentage.toFixed(1)}%</Text>
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.neutral[300]} />
      </View>

      <ProgressBar progress={progress} variant="primary" height={6} />

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.semantic.success }]}>
            {student.total_memorized}
          </Text>
          <Text style={styles.statLabel}>
            {t('reports.memorization.memorized')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent.indigo[600] }]}>
            {student.total_in_progress}
          </Text>
          <Text style={styles.statLabel}>
            {t('reports.memorization.inProgress')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.semantic.warning }]}>
            {student.items_needing_review}
          </Text>
          <Text style={styles.statLabel}>
            {t('reports.memorization.needsReviewLabel')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{student.total_recitations}</Text>
          <Text style={styles.statLabel}>
            {t('reports.memorization.recitations')}
          </Text>
        </View>
      </View>

      {student.avg_accuracy != null && (
        <View style={styles.accuracyRow}>
          <Ionicons name="star" size={normalize(14)} color={colors.secondary[500]} />
          <Text style={styles.accuracyLabel}>
            {t('reports.memorization.avgAccuracy')}
          </Text>
          <Text style={styles.accuracyValue}>{student.avg_accuracy.toFixed(1)} / 5</Text>
        </View>
      )}
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    marginBottom: spacing.sm,
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
  studentCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarPlaceholder: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  className: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: lightTheme.textTertiary,
  },
  percentage: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary[600],
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
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.secondary[50],
    borderRadius: radius.sm,
  },
  accuracyLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary[700],
  },
  accuracyValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.secondary[700],
  },
});
