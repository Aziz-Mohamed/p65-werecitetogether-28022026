import React, { useMemo } from 'react';
import { I18nManager, Pressable, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useStudentDashboard } from '@/features/dashboard/hooks/useStudentDashboard';
import { useRubCertifications, useRevisionHomework, FRESHNESS_DOT_COLORS } from '@/features/gamification';
import type { EnrichedCertification } from '@/features/gamification';
import { getAttendanceBadge } from '@/features/attendance/utils/attendance-badge';
import { useMemorizationStats } from '@/features/memorization';
import { useStudentUpcomingSessions } from '@/features/scheduling/hooks/useScheduledSessions';
import { useEnrollments } from '@/features/programs/hooks/useEnrollments';
import { HimamDashboardCard } from '@/features/himam/components/HimamDashboardCard';
import { useUpcomingEvent } from '@/features/himam/hooks/useUpcomingEvent';
import { useMyRegistration } from '@/features/himam/hooks/useMyRegistration';
import { typography } from '@/theme/typography';
import { lightTheme, colors, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import { useLocalizedName } from '@/hooks/useLocalizedName';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PREVIEW_ITEMS = 4;
const MAX_SESSION_PREVIEW = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface HomeworkRowProps {
  item: { assignmentId: string; rubNumber: number; juz: number };
  enriched: EnrichedCertification[];
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const HomeworkRow = React.memo(function HomeworkRow({ item, enriched, t }: HomeworkRowProps) {
  const cert = enriched.find((c) => c.rub_number === item.rubNumber);
  const dotColor = cert
    ? (FRESHNESS_DOT_COLORS[cert.freshness.state] ?? colors.primary[400])
    : colors.primary[400];

  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskDot, { backgroundColor: dotColor }]} />
      <View style={styles.taskInfo}>
        <Text style={styles.taskSurah} numberOfLines={1}>
          {t('gamification.rub')} {item.rubNumber}
        </Text>
        <Text style={styles.taskAyah}>
          {t('gamification.juz')} {item.juz}
        </Text>
      </View>
    </View>
  );
});

function getRelativeDateLabel(dateStr: string, t: (key: string) => string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return t('student.dashboard.today');
  if (diff === 1) return t('student.dashboard.tomorrow');
  return target.toLocaleDateString(undefined, { weekday: 'long' });
}

interface SessionPreviewRowProps {
  session: { id: string; class?: { name_localized?: unknown; name?: string }; start_time?: string; end_time?: string; teacher?: { full_name?: string } };
  t: (key: string) => string;
  resolveName: (localized: Record<string, string> | unknown, fallback: string | null | undefined) => string;
  onPress: () => void;
}

const SessionPreviewRow = React.memo(function SessionPreviewRow({ session, t, resolveName, onPress }: SessionPreviewRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.sessionPreviewRow}>
      <View style={styles.sessionPreviewDot} />
      <View style={styles.sessionPreviewInfo}>
        <Text style={styles.sessionPreviewTitle} numberOfLines={1}>
          {resolveName(session.class?.name_localized, session.class?.name) ?? t('scheduling.individualSession')}
        </Text>
        <Text style={styles.sessionPreviewMeta}>
          {session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}
          {session.teacher?.full_name ? `  ·  ${session.teacher.full_name}` : ''}
        </Text>
      </View>
    </Pressable>
  );
});

// ─── Student Dashboard ────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const { data, isLoading, error, refetch } = useStudentDashboard(profile?.id);
  const { enriched } = useRubCertifications(profile?.id);
  const { homeworkItems } = useRevisionHomework(profile?.id);
  const { data: memStats } = useMemorizationStats(profile?.id);
  const { resolveFirstName, resolveName } = useLocalizedName();

  const studentClassId = data?.student?.class_id;
  const classIds = useMemo(() => studentClassId ? [studentClassId] : [], [studentClassId]);
  const { data: upcomingSessions = [] } = useStudentUpcomingSessions(
    profile?.id,
    classIds,
    profile?.school_id ?? undefined,
  );

  // Himam dashboard
  const { data: enrollments } = useEnrollments(profile?.id);
  const himamProgramId = useMemo(
    () => enrollments?.find((e) =>
      e.programs?.name?.toLowerCase().includes('himam') ||
      e.programs?.name_ar?.includes('همم'),
    )?.program_id,
    [enrollments],
  );
  const { data: himamEvent } = useUpcomingEvent(himamProgramId);
  const { data: himamRegistration } = useMyRegistration(himamEvent?.id, profile?.id);

  const homeworkRubSet = useMemo(
    () => new Set(homeworkItems.map((h) => h.rubNumber)),
    [homeworkItems],
  );

  const effectiveCriticalCount = useMemo(
    () => enriched.filter(
      (c) => (c.freshness.state === 'critical' || c.freshness.state === 'warning')
        && !homeworkRubSet.has(c.rub_number),
    ).length,
    [enriched, homeworkRubSet],
  );

  // Freshness health counts
  const healthCounts = useMemo(() => {
    const counts: Record<string, number> = {
      fresh: 0, fading: 0, warning: 0, critical: 0, dormant: 0,
    };
    for (const cert of enriched) {
      counts[cert.freshness.state] = (counts[cert.freshness.state] ?? 0) + 1;
    }
    return counts;
  }, [enriched]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  const student = data?.student;
  const attendance = getAttendanceBadge(data?.todayAttendance?.status, t);
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const hasWarning = effectiveCriticalCount > 0;
  const hasCertifications = enriched.length > 0;

  return (
    <Screen
      scroll
      hasTabBar
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={refetch} />
      }
    >
      <View style={styles.container}>
        {/* 1. Header + Attendance Badge */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })}
            </Text>
            <Text style={styles.subtitle}>{t('student.dashboard.readyToLearn')}</Text>
          </View>
          <Badge
            label={attendance.label}
            variant={attendance.variant}
            size="md"
          />
        </View>

        {/* 2. Streak + Progress Card */}
        <Card variant="default" style={styles.heroCard}>
          {/* Streak Banner */}
          <View style={styles.streakBanner}>
            <View style={styles.streakLeft}>
              <Ionicons name="flame" size={normalize(28)} color={colors.accent.rose[500]} />
              <View>
                <Text style={styles.streakNumber}>{student?.current_streak ?? 0}</Text>
                <Text style={styles.streakLabel}>{t('student.dashboard.dayStreak')}</Text>
              </View>
            </View>
            {(student?.current_streak ?? 0) > 0 ? (
              <Text style={styles.bestStreak}>
                {t('student.dashboard.bestStreak', { count: student?.longest_streak ?? 0 })}
              </Text>
            ) : (
              <Text style={styles.startStreak}>{t('student.dashboard.startStreak')}</Text>
            )}
          </View>

          <View style={styles.heroDivider} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statBlock, { backgroundColor: colors.accent.indigo[50] }]}>
              <Text style={[styles.statValue, { color: colors.accent.indigo[600] }]}>
                {memStats?.quran_percentage != null
                  ? `${memStats.quran_percentage.toFixed(1)}%`
                  : '0%'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.accent.indigo[500] }]}>
                {t('student.dashboard.quranMemorized')}
              </Text>
            </View>
            <View style={[styles.statBlock, { backgroundColor: colors.secondary[50] }]}>
              <Text style={[styles.statValue, { color: colors.secondary[600] }]}>
                {data?.totalStickers ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary[500] }]}>
                {t('student.dashboard.stickers')}
              </Text>
            </View>
            <View style={[styles.statBlock, { backgroundColor: colors.primary[50] }]}>
              <Text style={[styles.statValue, { color: colors.primary[600] }]}>
                {data?.totalSessions ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.primary[500] }]}>
                {t('student.dashboard.sessions')}
              </Text>
            </View>
          </View>
        </Card>

        {/* 3. Revision Health Summary */}
        {hasCertifications && (
          <Card
            variant="default"
            onPress={() => router.push('/(student)/(tabs)/revision')}
            style={styles.tasksCard}
          >
            <View style={styles.tasksHeader}>
              <View style={[styles.tasksIcon, { backgroundColor: hasWarning ? secondary[100] : colors.primary[50] }]}>
                <Ionicons
                  name={hasWarning ? 'alert-circle' : 'pulse'}
                  size={20}
                  color={hasWarning ? secondary[800] : colors.primary[500]}
                />
              </View>
              <View style={styles.healthTitleCol}>
                <Text style={styles.tasksTitle}>{t('student.dashboard.revisionHealth')}</Text>
                <Text style={styles.healthSubtitle}>
                  {hasWarning
                    ? t('gamification.revisionWarning', { count: effectiveCriticalCount })
                    : t('student.dashboard.revisionHealthGood')}
                </Text>
              </View>
              <Ionicons name={chevron} size={18} color={colors.neutral[300]} />
            </View>

            {/* Stacked health bar */}
            <View style={styles.healthBarContainer}>
              <View style={styles.healthBarTrack}>
                {(['critical', 'warning', 'fading', 'fresh', 'dormant'] as const).map((state) => {
                  const count = healthCounts[state] ?? 0;
                  if (count === 0) return null;
                  const pct = (count / enriched.length) * 100;
                  return (
                    <View
                      key={state}
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: FRESHNESS_DOT_COLORS[state],
                      }}
                    />
                  );
                })}
              </View>
              <Text style={styles.healthBarLabel}>
                {enriched.length}/240
              </Text>
            </View>
          </Card>
        )}

        {/* 3b. Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <Card
            variant="default"
            onPress={() => router.push('/(student)/schedule')}
            style={styles.tasksCard}
          >
            <View style={styles.tasksHeader}>
              <View style={[styles.tasksIcon, { backgroundColor: colors.accent.sky[50] }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent.sky[500]} />
              </View>
              <Text style={styles.tasksTitle}>{t('student.dashboard.upcomingSessions')}</Text>
              <View style={styles.homeworkBadge}>
                <Text style={styles.homeworkBadgeText}>{upcomingSessions.length}</Text>
              </View>
              <Ionicons name={chevron} size={18} color={colors.neutral[300]} />
            </View>

            <View style={styles.tasksList}>
              {upcomingSessions.slice(0, MAX_SESSION_PREVIEW).map((session: any) => (
                <View key={session.id}>
                  <Text style={styles.sessionDateLabel}>
                    {getRelativeDateLabel(session.session_date, t)}
                  </Text>
                  <SessionPreviewRow
                    session={session}
                    t={t}
                    resolveName={resolveName}
                    onPress={() => router.push(`/(student)/schedule/${session.id}`)}
                  />
                </View>
              ))}
            </View>
            {upcomingSessions.length > MAX_SESSION_PREVIEW && (
              <Text style={styles.seeAll}>
                {t('student.dashboard.viewAllSchedule')} {isRTL ? '←' : '→'}
              </Text>
            )}
          </Card>
        )}

        {/* 3c. Himam Marathon */}
        {himamEvent && (
          <HimamDashboardCard
            event={himamEvent}
            registration={himamRegistration}
            onPress={() => router.push({
              pathname: '/(student)/himam',
              params: { programId: himamProgramId! },
            })}
          />
        )}

        {/* 3d. Revision Homework */}
        {homeworkItems.length > 0 && (
          <Card
            variant="default"
            onPress={() => router.push('/(student)/(tabs)/revision')}
            style={styles.tasksCard}
          >
            <View style={styles.tasksHeader}>
              <View style={[styles.tasksIcon, { backgroundColor: colors.secondary[50] }]}>
                <Ionicons name="book-outline" size={20} color={colors.secondary[500]} />
              </View>
              <Text style={styles.tasksTitle}>{t('student.revision.revisionHomework')}</Text>
              <View style={styles.homeworkBadge}>
                <Text style={styles.homeworkBadgeText}>{homeworkItems.length}</Text>
              </View>
              <Ionicons name={chevron} size={18} color={colors.neutral[300]} />
            </View>

            <View style={styles.tasksList}>
              {homeworkItems.slice(0, MAX_PREVIEW_ITEMS).map((item) => (
                <HomeworkRow key={item.assignmentId} item={item} enriched={enriched} t={t} />
              ))}
            </View>
            {homeworkItems.length > MAX_PREVIEW_ITEMS && (
              <Text style={styles.seeAll}>
                {t('student.dashboard.seeAll', { count: homeworkItems.length })} {isRTL ? '←' : '→'}
              </Text>
            )}
          </Card>
        )}

        {/* 4. Explore */}
        <View style={styles.exploreRow}>
          <Pressable
            style={[styles.explorePill, { backgroundColor: colors.accent.violet[50] }]}
            onPress={() => router.push('/(student)/(tabs)/journey')}
          >
            <Ionicons name="map" size={14} color={colors.accent.violet[500]} />
            <Text style={[styles.explorePillText, { color: colors.accent.violet[600] }]}>
              {t('student.dashboard.journey')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.explorePill, { backgroundColor: colors.accent.sky[50] }]}
            onPress={() => router.push('/(student)/schedule')}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.accent.sky[500]} />
            <Text style={[styles.explorePillText, { color: colors.accent.sky[600] }]}>
              {t('student.dashboard.mySchedule')}
            </Text>
          </Pressable>
          {enrollments?.[0]?.program_id && (
            <Pressable
              style={[styles.explorePill, { backgroundColor: colors.secondary[50] }]}
              onPress={() => router.push({
                pathname: '/(student)/program/[programId]/leaderboard',
                params: { programId: enrollments[0].program_id },
              })}
            >
              <Ionicons name="podium" size={14} color={colors.secondary[500]} />
              <Text style={[styles.explorePillText, { color: colors.secondary[600] }]}>
                {t('student.dashboard.viewLeaderboard')}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.exploreRow}>
          <Pressable
            style={[styles.explorePill, { backgroundColor: colors.accent.indigo[50] }]}
            onPress={() => router.push('/(student)/programs')}
          >
            <Ionicons name="library-outline" size={14} color={colors.accent.indigo[500]} />
            <Text style={[styles.explorePillText, { color: colors.accent.indigo[600] }]}>
              {t('student.tabs.programs')}
            </Text>
          </Pressable>
        </View>

      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(2),
  },

  // Cards
  tasksCard: {
    padding: spacing.md,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tasksIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksTitle: {
    flex: 1,
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  tasksList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskSurah: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[900],
    flexShrink: 1,
  },
  taskAyah: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },
  seeAll: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
    color: colors.accent.indigo[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },

  // Revision Health
  healthTitleCol: {
    flex: 1,
    gap: normalize(2),
  },
  healthSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(11),
    color: colors.neutral[500],
  },
  healthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  healthBarTrack: {
    flex: 1,
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: colors.neutral[100],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  healthBarLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
    color: colors.neutral[500],
  },

  // Hero Card (Streak + Stats)
  heroCard: {
    padding: spacing.md,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(26),
    color: colors.neutral[900],
    lineHeight: normalize(30),
  },
  streakLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },
  bestStreak: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[400],
  },
  startStreak: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
    color: colors.accent.rose[500],
    flexShrink: 1,
    textAlign: 'auto' as const,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: normalize(2),
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(16),
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(11),
  },

  // Homework Badge
  homeworkBadge: {
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.full,
    minWidth: normalize(24),
    alignItems: 'center',
  },
  homeworkBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(11),
    color: colors.secondary[600],
  },

  // Session Preview
  sessionDateLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: normalize(2),
  },
  sessionPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionPreviewDot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: colors.accent.sky[500],
  },
  sessionPreviewInfo: {
    flex: 1,
  },
  sessionPreviewTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[900],
  },
  sessionPreviewMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(11),
    color: colors.neutral[500],
  },

  // Explore Pills
  exploreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  explorePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(4),
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  explorePillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
  },
});
