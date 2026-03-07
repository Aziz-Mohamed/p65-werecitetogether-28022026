import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui';
import { LoadingState, EmptyState } from '@/components/feedback';
import { SelfAssignmentForm } from '@/features/memorization/components/SelfAssignmentForm';
import { RubBuildingBlock, BLOCK_SIZE } from '@/features/memorization/components/RubBuildingBlock';
import { RubDetailSheet } from '@/features/memorization/components/RubDetailSheet';
import type { RubCoverage } from '@/features/memorization/utils/rub-coverage';
import { useRubCoverage } from '@/features/memorization/hooks/useRubCoverage';
import { useCancelAssignment } from '@/features/memorization/hooks/useAssignments';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';
import { useMemorizationProgress } from '@/features/memorization/hooks/useMemorizationProgress';
import { useRubCertifications } from '@/features/gamification/hooks/useRubCertifications';
import { useStudentDashboard } from '@/features/dashboard/hooks/useStudentDashboard';
import { useAuth } from '@/hooks/useAuth';
import { SURAHS } from '@/lib/quran-metadata';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { shadows } from '@/theme/shadows';

// ─── Memorization Screen (Block Builder) ────────────────────────────────────

export default function MemorizationScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isRTL = I18nManager.isRTL;

  const { data: stats } = useMemorizationStats(profile?.id);
  const { data: dashboardData, isLoading: dashboardLoading } = useStudentDashboard(profile?.id);
  const { enriched: certifications } = useRubCertifications(profile?.id);
  const { data: progress = [], isLoading: progressLoading } = useMemorizationProgress({
    studentId: profile?.id ?? '',
  });

  const {
    uncertified,
    isLoading: coverageLoading,
  } = useRubCoverage(profile?.id);

  const cancelAssignment = useCancelAssignment();

  const canSelfAssign = dashboardData?.student?.can_self_assign ?? false;
  const schoolId = dashboardData?.student?.school_id ?? '';
  const [formVisible, setFormVisible] = useState(false);
  const [selectedRub, setSelectedRub] = useState<RubCoverage | null>(null);

  const handleCancelAssignments = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map((id) => cancelAssignment.mutateAsync(id)));
      setSelectedRub(null);
    },
    [cancelAssignment],
  );

  // Stats
  const certifiedCount = certifications.length;
  const totalMemorized = stats?.total_ayahs_memorized ?? 0;

  // Compact surah journey (kept as secondary view)
  const surahsWithProgress = useMemo(() => {
    const map = new Map<number, { memorized: number; total: number }>();

    for (const item of progress) {
      const existing = map.get(item.surah_number) ?? { memorized: 0, total: 0 };
      const ayahCount = item.to_ayah - item.from_ayah + 1;
      existing.total += ayahCount;
      if (item.status === 'memorized') {
        existing.memorized += ayahCount;
      }
      map.set(item.surah_number, existing);
    }

    return SURAHS.filter((s) => map.has(s.number)).map((s) => {
      const data = map.get(s.number)!;
      return {
        ...s,
        memorizedAyahs: data.memorized,
        totalTrackedAyahs: data.total,
        progress: data.total > 0 ? data.memorized / s.ayahCount : 0,
        percentage: data.total > 0 ? Math.round((data.memorized / s.ayahCount) * 100) : 0,
      };
    });
  }, [progress]);

  const isLoading = coverageLoading || progressLoading || dashboardLoading;

  if (isLoading) return <LoadingState />;

  const hasBlocks = uncertified.length > 0;

  return (
    <>
      <Screen scroll hasTabBar>
        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.title}>{t('memorization.title')}</Text>

          {/* Hero Card — simplified, no progress bar */}
          <Card variant="default" style={styles.heroCard}>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroNumber}>{certifiedCount}</Text>
                <Text style={styles.heroLabel}>
                  {t('student.blockBuilder.heroRub', { count: certifiedCount })}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroNumber}>{totalMemorized.toLocaleString()}</Text>
                <Text style={styles.heroLabel}>
                  {t('student.blockBuilder.heroAyahs', {
                    memorized: totalMemorized.toLocaleString(),
                    total: '6,236',
                  })}
                </Text>
              </View>
            </View>
          </Card>

          {/* Uncertified Blocks — single flat grid */}
          {hasBlocks && (
            <View style={styles.blockGrid}>
              {uncertified.map((coverage) => (
                <RubBuildingBlock
                  key={coverage.rubNumber}
                  coverage={coverage}
                  onPress={() => setSelectedRub(coverage)}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {!hasBlocks && (
            <EmptyState
              icon="cube-outline"
              title={t('student.blockBuilder.emptyTitle')}
              description={t('student.blockBuilder.emptyDescription')}
            />
          )}

          {/* Your Journey — COMPACT surah list (secondary view) */}
          {surahsWithProgress.length > 0 && (
            <>
              <Text style={styles.journeyHeader}>
                {t('memorization.yourJourney')}
              </Text>
              <View style={styles.journeyList}>
                {surahsWithProgress.map((surah) => (
                  <View key={surah.number} style={styles.journeyRow}>
                    <Text style={styles.journeyNum}>{surah.number}</Text>
                    <Text style={isRTL ? styles.journeyNameArabic : styles.journeyName} numberOfLines={1}>
                      {isRTL ? surah.nameArabic : surah.nameEnglish}
                    </Text>
                    <View style={styles.journeyBarContainer}>
                      <ProgressBar
                        progress={surah.progress}
                        variant="primary"
                        height={4}
                      />
                    </View>
                    <Text style={styles.journeyPct}>{surah.percentage}%</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </Screen>

      {/* FAB — Add Homework */}
      {canSelfAssign && profile?.id && (
        <Pressable
          style={styles.fab}
          onPress={() => setFormVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('memorization.selfAssign.title')}
        >
          <Ionicons name="add" size={normalize(28)} color={colors.white} />
        </Pressable>
      )}

      {/* Self-Assignment Form Modal */}
      {profile?.id && schoolId ? (
        <SelfAssignmentForm
          visible={formVisible}
          onClose={() => setFormVisible(false)}
          studentId={profile.id}
          schoolId={schoolId}
        />
      ) : null}

      {/* Rub' Detail Sheet */}
      <RubDetailSheet
        visible={!!selectedRub}
        coverage={selectedRub}
        onClose={() => setSelectedRub(null)}
        onCancelAssignments={handleCancelAssignments}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },

  // Hero Card — no progress bar
  heroCard: {
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: normalize(2),
  },
  heroNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(22),
    color: colors.accent.indigo[600],
  },
  heroLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(11),
    color: colors.neutral[500],
  },
  heroDivider: {
    width: 1,
    height: normalize(32),
    backgroundColor: colors.neutral[200],
  },

  // Section Headers
  sectionHeader: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    fontSize: normalize(15),
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Block grid — flex-wrap for square blocks
  blockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Journey Section — COMPACT
  journeyHeader: {
    ...typography.textStyles.subheading,
    color: lightTheme.textSecondary,
    fontSize: normalize(14),
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  journeyList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  journeyNum: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(11),
    color: colors.neutral[400],
    width: normalize(22),
    textAlign: 'center',
  },
  journeyName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: lightTheme.text,
    width: normalize(80),
  },
  journeyNameArabic: {
    fontFamily: typography.fontFamily.arabicBold,
    fontSize: normalize(13),
    color: lightTheme.text,
    width: normalize(70),
  },
  journeyBarContainer: {
    flex: 1,
  },
  journeyPct: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
    color: colors.neutral[500],
    width: normalize(32),
    textAlign: 'right',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: normalize(120),
    right: spacing.lg,
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: colors.accent.indigo[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.indigo,
  },
});
