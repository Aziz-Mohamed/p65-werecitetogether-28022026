import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { MemorizationProgressBar } from '@/features/memorization';
import { useMemorizationProgress } from '@/features/memorization/hooks/useMemorizationProgress';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';
import { useStudentById } from '@/features/students/hooks/useStudents';
import { SURAHS, getSurah } from '@/lib/quran-metadata';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

// ─── Status Colors ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new: { color: colors.accent.indigo[600], bg: colors.accent.indigo[50] },
  learning: { color: colors.secondary[700], bg: colors.secondary[50] },
  memorized: { color: colors.semantic.success, bg: colors.primary[100] },
  needs_review: { color: colors.semantic.warning, bg: colors.secondary[100] },
};

// ─── Teacher Student Memorization Screen ─────────────────────────────────────

export default function TeacherStudentMemorizationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: student } = useStudentById(id);
  const { data: stats, isLoading: statsLoading } = useMemorizationStats(id);
  const { data: progress = [], isLoading: progressLoading, error, refetch } = useMemorizationProgress({
    studentId: id ?? '',
  });
  const [expandedSurah, setExpandedSurah] = useState<number | null>(null);

  const studentName = resolveName((student as any)?.profiles?.name_localized, (student as any)?.profiles?.full_name) ?? 'Student';

  // Group progress by surah
  const surahStats = useMemo(() => {
    const map = new Map<number, { memorized: number; total: number; items: any[]; needsReview: number }>();

    for (const item of progress) {
      const existing = map.get(item.surah_number) ?? { memorized: 0, total: 0, items: [], needsReview: 0 };
      const ayahCount = item.to_ayah - item.from_ayah + 1;
      existing.total += ayahCount;
      if (item.status === 'memorized') existing.memorized += ayahCount;
      if (item.status === 'needs_review') existing.needsReview += 1;
      existing.items.push(item);
      map.set(item.surah_number, existing);
    }

    return map;
  }, [progress]);

  const surahsWithProgress = useMemo(() => {
    return SURAHS.filter((s) => surahStats.has(s.number)).map((s) => {
      const stat = surahStats.get(s.number)!;
      return {
        ...s,
        memorizedAyahs: stat.memorized,
        progress: stat.total > 0 ? stat.memorized / s.ayahCount : 0,
        items: stat.items,
        needsReview: stat.needsReview,
      };
    });
  }, [surahStats]);

  const isLoading = statsLoading || progressLoading;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('memorization.studentMemorization', { name: studentName })}</Text>

        {/* Overall Stats */}
        <Card variant="primary-glow" style={styles.statsCard}>
          <MemorizationProgressBar stats={stats ?? null} />
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button
            title={t('memorization.assignNewHifz')}
            onPress={() => router.push(`/(teacher)/assignments/create?studentId=${id}`)}
            variant="primary"
            size="md"
            icon={<Ionicons name="add-circle-outline" size={18} color={colors.white} />}
            style={styles.actionButton}
          />
        </View>

        {/* Needs Review Highlight */}
        {progress.filter((p: any) => p.status === 'needs_review').length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={18} color={colors.semantic.warning} />
              <Text style={styles.sectionTitle}>{t('memorization.needsReview')}</Text>
              <Badge
                label={String(progress.filter((p: any) => p.status === 'needs_review').length)}
                variant="warning"
              />
            </View>
            {progress
              .filter((p: any) => p.status === 'needs_review')
              .slice(0, 5)
              .map((item: any) => {
                const surah = getSurah(item.surah_number);
                return (
                  <Card key={item.id} variant="outlined" style={styles.reviewItem}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewSurah}>{surah?.nameArabic ?? ''}</Text>
                      <Text style={styles.reviewRange}>
                        {t('memorization.ayahRange', { from: item.from_ayah, to: item.to_ayah })}
                      </Text>
                      {item.avg_accuracy != null && (
                        <Text style={styles.reviewScore}>
                          {Number(item.avg_accuracy).toFixed(1)}/5
                        </Text>
                      )}
                    </View>
                  </Card>
                );
              })}
          </>
        )}

        {/* Surah Progress Map */}
        <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>
          {t('memorization.surahsStarted', { count: surahsWithProgress.length })}
        </Text>

        {surahsWithProgress.map((surah) => {
          const isExpanded = expandedSurah === surah.number;
          return (
            <Card key={surah.number} variant="default" style={styles.surahCard}>
              <Pressable
                onPress={() => setExpandedSurah(isExpanded ? null : surah.number)}
                style={styles.surahRow}
              >
                <View style={styles.surahInfo}>
                  <View style={styles.surahNameRow}>
                    <Text style={styles.surahNumber}>{surah.number}</Text>
                    <View>
                      <Text style={styles.surahArabic}>{surah.nameArabic}</Text>
                      <Text style={styles.surahEnglish}>{surah.nameEnglish}</Text>
                    </View>
                  </View>
                  {surah.needsReview > 0 && (
                    <Badge label={t('memorization.needReviewCount', { count: surah.needsReview })} variant="warning" size="sm" />
                  )}
                  <ProgressBar progress={surah.progress} variant="primary" height={6} showLabel />
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={lightTheme.textTertiary}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.ayahDetails}>
                  {surah.items.map((item: any, idx: number) => {
                    const sc = STATUS_COLORS[item.status] ?? STATUS_COLORS.new;
                    return (
                      <View key={idx} style={styles.ayahRange}>
                        <Text style={styles.ayahRangeText}>
                          {t('memorization.ayahRange', { from: item.from_ayah, to: item.to_ayah })}
                        </Text>
                        <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.statusChipText, { color: sc.color }]}>
                            {t(`memorization.status.${item.status}`)}
                          </Text>
                        </View>
                        {item.avg_accuracy != null && (
                          <Text style={styles.ayahScore}>
                            {Number(item.avg_accuracy).toFixed(1)}/5
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(20),
  },
  statsCard: {
    padding: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  sectionTitleStandalone: {
    marginTop: spacing.md,
  },
  reviewItem: {
    padding: spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewSurah: {
    fontFamily: typography.fontFamily.arabicBold,
    fontSize: typography.fontSize.base,
    color: lightTheme.text,
    flex: 1,
  },
  reviewRange: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: lightTheme.textSecondary,
  },
  reviewScore: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.semantic.warning,
  },
  surahCard: {
    padding: spacing.md,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  surahInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  surahNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  surahNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: lightTheme.textTertiary,
    width: normalize(28),
    textAlign: 'center',
  },
  surahArabic: {
    fontFamily: typography.fontFamily.arabicBold,
    fontSize: typography.fontSize.base,
    color: lightTheme.text,
  },
  surahEnglish: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: lightTheme.textSecondary,
  },
  ayahDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing.sm,
  },
  ayahRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ayahRangeText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: lightTheme.text,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.xs,
  },
  statusChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(10),
    textTransform: 'uppercase',
  },
  ayahScore: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: lightTheme.textSecondary,
    minWidth: normalize(36),
    textAlign: 'auto',
  },
});
