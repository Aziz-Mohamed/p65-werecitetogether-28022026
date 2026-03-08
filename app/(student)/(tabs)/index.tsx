import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

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
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function StudentHomeScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const displayName = profile?.display_name || profile?.full_name || '';
  const studentId = profile?.id;

  const { data: recentSessions = [], isLoading } = useSessionsByStudent(
    studentId,
    'completed',
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
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>
            {t('dashboard.welcome', { name: displayName })}
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('programs.browsePrograms')}</Text>
          <Text style={styles.cardDescription}>
            {t('programs.allPrograms')}
          </Text>
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
          <Pressable
            style={[styles.explorePill, { backgroundColor: colors.secondary[50] }]}
            onPress={() => router.push('/(student)/leaderboard')}
          >
            <Ionicons name="podium" size={14} color={colors.secondary[500]} />
            <Text style={[styles.explorePillText, { color: colors.secondary[600] }]}>
              {t('student.dashboard.viewLeaderboard')}
            </Text>
          </Pressable>
        </View>

        <SessionHistoryList
          sessions={recentSessions.slice(0, 5)}
          isLoading={isLoading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    paddingBlockEnd: spacing.xs,
  },
  welcome: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
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
  },
  cardTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xs,
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
});
