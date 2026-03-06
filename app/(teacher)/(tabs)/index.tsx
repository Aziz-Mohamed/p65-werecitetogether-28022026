import React from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherDashboard } from '@/features/dashboard/hooks/useTeacherDashboard';
import { useTeacherUpcomingSessions } from '@/features/scheduling/hooks/useScheduledSessions';
import { useMyAvailability } from '@/features/teacher-availability/hooks/useMyAvailability';
import { useTeacherRatingStats } from '@/features/ratings/hooks/useTeacherRatingStats';
import { RatingStatsCard } from '@/features/ratings/components/RatingStatsCard';
import { DemandIndicator } from '@/features/queue/components/DemandIndicator';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

const STATUS_BADGE_VARIANT: Record<string, 'sky' | 'warning' | 'success' | 'default'> = {
  scheduled: 'sky',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'default',
  missed: 'warning',
};

// ─── Teacher Dashboard ────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { profile, schoolId } = useAuth();
  const router = useRouter();
  const theme = useRoleTheme();
  const { resolveFirstName, resolveName } = useLocalizedName();

  const { data, isLoading, error, refetch } = useTeacherDashboard(profile?.id);
  const { data: upcomingSessions = [] } = useTeacherUpcomingSessions(profile?.id, schoolId ?? undefined);
  const { data: myAvailability = [] } = useMyAvailability();

  const availableCount = myAvailability.filter((a) => a.is_available).length;
  const firstProgramId = myAvailability[0]?.program_id;
  const { data: ratingStats } = useTeacherRatingStats(profile?.id, firstProgramId);
  const nextSession = upcomingSessions[0] ?? null;

  const handleNextSession = () => {
    if (nextSession) {
      router.push(`/(teacher)/schedule/${nextSession.id}`);
    } else {
      router.navigate('/(teacher)/(tabs)/sessions');
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })} 👋
            </Text>
            <Text style={styles.subtitle}>{t('teacher.dashboard.readyToTeach')}</Text>
          </View>
          <Badge label={t('roles.teacher')} variant={theme.tag} size="md" />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{data?.todaySessionCount ?? 0}</Text>
            <Text style={styles.statLabel}>{t('teacher.dashboard.sessionsToday')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.sky[500] }]}>{data?.todayStudentsSeen ?? 0}</Text>
            <Text style={styles.statLabel}>{t('teacher.dashboard.studentsSeen')}</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionsRow}>
          <Button
            title={t('scheduling.nextSession')}
            onPress={handleNextSession}
            variant={theme.tag}
            size="md"
            icon={<Ionicons name="arrow-forward-circle" size={20} color={colors.white} />}
            style={styles.actionButton}
          />
          <Button
            title={t('teacher.awardSticker')}
            onPress={() => router.push('/(teacher)/awards')}
            variant="ghost"
            size="md"
            icon={<Ionicons name="star" size={20} color={colors.secondary[500]} />}
            style={[styles.actionButton, { backgroundColor: colors.secondary[50] }]}
          />
        </View>

        {/* My Schedule */}
        <Card
          variant="glass"
          onPress={() => router.navigate('/(teacher)/(tabs)/sessions')}
          style={styles.scheduleCard}
        >
          <View style={styles.scheduleRow}>
            <View style={[styles.insightIcon, { backgroundColor: colors.accent.indigo[50] }]}>
              <Ionicons name="calendar" size={22} color={colors.accent.indigo[500]} />
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleLabel}>{t('scheduling.mySchedule')}</Text>
              <Text style={styles.scheduleHint}>{t('scheduling.viewUpcoming')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
          </View>
        </Card>

        {/* Availability */}
        <Card
          variant="glass"
          onPress={() => router.push('/(teacher)/availability')}
          style={styles.scheduleCard}
        >
          <View style={styles.scheduleRow}>
            <View style={[styles.insightIcon, { backgroundColor: availableCount > 0 ? '#DCFCE7' : colors.neutral[100] }]}>
              <Ionicons name="radio-button-on" size={22} color={availableCount > 0 ? '#22C55E' : colors.neutral[400]} />
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleLabel}>{t('availability.title')}</Text>
              <Text style={styles.scheduleHint}>
                {availableCount > 0
                  ? t('availability.availableForPrograms', { count: availableCount })
                  : t('availability.offline')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
          </View>
        </Card>

        {/* Demand Indicators — students waiting in queue */}
        {myAvailability.map((avail) => (
          <DemandIndicator
            key={avail.id}
            programId={avail.program_id}
            programName={avail.programs?.name ?? ''}
          />
        ))}

        {/* Rating Stats */}
        {ratingStats && ratingStats.total_reviews >= 5 && (
          <RatingStatsCard stats={ratingStats} />
        )}

        {/* Student Insights */}
        <Text style={styles.sectionTitle}>{t('teacher.todayOverview')}</Text>
        <View style={styles.actionsRow}>
          <Card
            variant="glass"
            onPress={() => router.push('/(teacher)/students/top-performers')}
            style={styles.insightCard}
          >
            <View style={[styles.insightIcon, { backgroundColor: colors.secondary[50] }]}>
              <Ionicons name="trophy" size={22} color={colors.secondary[500]} />
            </View>
            <Text style={styles.insightLabel}>{t('teacher.topPerformers')}</Text>
          </Card>
          <Card
            variant="glass"
            onPress={() => router.push('/(teacher)/students/needs-support')}
            style={styles.insightCard}
          >
            <View style={[styles.insightIcon, { backgroundColor: colors.accent.rose[50] }]}>
              <Ionicons name="hand-left-outline" size={22} color={semantic.warning} />
            </View>
            <Text style={styles.insightLabel}>{t('teacher.needsSupport')}</Text>
          </Card>
        </View>

        {/* Recent Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentSessions')}</Text>
          <Badge label={String(data?.totalStudents ?? 0)} variant="sky" />
        </View>
        {(data?.recentSessions ?? []).length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('teacher.dashboard.noRecentSessions')}</Text>
          </Card>
        ) : (
          data?.recentSessions.map((session) => {
            const score = session.evaluation?.memorization_score;
            return (
              <Card
                key={session.id}
                variant="default"
                onPress={() => router.push(`/(teacher)/schedule/${session.id}`)}
                style={styles.recentCard}
              >
                <View style={styles.recentCardRow}>
                  <View style={styles.recentCardInfo}>
                    <Text style={styles.recentCardTitle} numberOfLines={1}>
                      {resolveName(session.class?.name_localized, session.class?.name) ?? t('scheduling.individualSession')}
                    </Text>
                    <Text style={styles.recentCardMeta}>
                      {session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}
                      {session.student?.profiles?.full_name
                        ? `  ·  ${resolveName(session.student.profiles?.name_localized, session.student.profiles.full_name)}`
                        : ''}
                    </Text>
                  </View>
                  {score != null && (
                    <Badge
                      label={`${score}/5`}
                      variant={score >= 4 ? 'success' : 'warning'}
                      size="sm"
                    />
                  )}
                  <Badge
                    label={t(`scheduling.status.${session.status}`)}
                    variant={STATUS_BADGE_VARIANT[session.status] ?? 'default'}
                    size="sm"
                  />
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={16}
                    color={colors.neutral[300]}
                  />
                </View>
              </Card>
            );
          })
        )}
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(28),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: normalize(16),
  },
  scheduleCard: {
    padding: spacing.md,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  scheduleHint: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  insightCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  insightIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  recentCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentCardInfo: {
    flex: 1,
    gap: normalize(3),
  },
  recentCardTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  recentCardMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
