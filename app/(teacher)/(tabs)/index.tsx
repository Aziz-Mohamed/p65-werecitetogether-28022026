import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
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
import {
  useToggleAvailability,
} from '@/features/teacher-availability/hooks/useTeacherAvailability';
import { RatingStatsDisplay } from '@/features/teacher-ratings/components/RatingStatsDisplay';
import { sessionsService } from '@/features/sessions/services/sessions.service';
import { useSessionsRealtime } from '@/features/realtime';
import { useQuery } from '@tanstack/react-query';
import { typography } from '@/theme/typography';
import { lightTheme, primary, accent, neutral, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const theme = useRoleTheme();
  const teacherId = profile?.id ?? '';
  const displayName = profile?.display_name ?? profile?.full_name ?? '';

  const { data, isLoading, error, refetch } = useTeacherDashboard(profile?.id);
  const { data: upcomingSessions = [] } = useTeacherUpcomingSessions(profile?.id, schoolId ?? undefined);
  const { data: myAvailability = [] } = useMyAvailability();

  const availableCount = myAvailability.filter((a) => a.is_available).length;
  const firstProgramId = myAvailability[0]?.program_id;
  const { data: ratingStats } = useTeacherRatingStats(profile?.id, firstProgramId);
  const nextSession = upcomingSessions[0] ?? null;

  // Track whether teacher is currently available
  const [isAvailable, setIsAvailable] = useState(false);

  // Realtime sessions subscription
  useSessionsRealtime(teacherId || undefined, 'teacher_id');

  // Today's completed count
  const { data: todayCount = 0 } = useQuery({
    queryKey: ['sessions', 'today-completed', teacherId],
    queryFn: async () => {
      const result = await sessionsService.getTodayCompletedCount(teacherId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!teacherId,
    staleTime: 30_000,
  });

  // Recent sessions
  const { data: recentSessions = [] } = useQuery({
    queryKey: ['sessions', 'teacher', teacherId],
    queryFn: async () => {
      const result = await sessionsService.getSessionsByTeacher(teacherId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!teacherId,
    staleTime: 30_000,
  });

  const draftSessions = recentSessions.filter((s) => s.status === 'draft');

  const handleToggle = useCallback(
    (value: boolean) => {
      if (!selectedProgramId) return;
      setIsAvailable(value);
      toggleAvailability.mutate(
        { programId: selectedProgramId, isAvailable: value },
        {
          onError: () => setIsAvailable(!value),
        },
      );
    },
    [selectedProgramId, toggleAvailability],
  );

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: displayName })}
            </Text>
          </View>
          <Badge label={t('roles.teacher')} variant="violet" size="md" />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {todayCount}
            </Text>
            <Text style={styles.statLabel}>
              {t('sessions.todayCompleted', { count: todayCount })}
            </Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.sky[500] }]}>
              {draftSessions.length}
            </Text>
            <Text style={styles.statLabel}>{t('sessions.draft')}</Text>
          </Card>
        </View>

        {/* Rating Stats */}
        {selectedProgramId && (
          <>
            <Text style={styles.sectionTitle}>{t('ratings.myRatings')}</Text>
            <RatingStatsDisplay teacherId={teacherId} programId={selectedProgramId} />
          </>
        )}

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
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionStudent} numberOfLines={1}>
                        {t('sessions.draft')}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Badge label={t('sessions.draft')} variant="sky" size="sm" />
                  </View>
                </Card>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}

        {/* Empty state when no drafts */}
        {draftSessions.length === 0 && (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={32}
              color={neutral[300]}
            />
            <Text style={styles.emptyText}>
              {t('sessions.noSessions')}
            </Text>
          </Card>
        )}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBlockEnd: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
  },
  availabilityCard: {
    padding: spacing.base,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  availabilityTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  availabilityHint: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: spacing.lg,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(28),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
    marginBlockStart: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  sessionCard: {
    padding: spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionStudent: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  sessionMeta: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
