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

  // For MVP, we use the first program the teacher is associated with
  // A full program selector can be added later
  const [selectedProgramId] = useState<string | undefined>(undefined);

  const toggleAvailability = useToggleAvailability();

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

        {/* Active Draft Sessions */}
        {draftSessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('sessions.recentSessions')}
            </Text>
            <FlatList
              data={draftSessions.slice(0, 5)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Card variant="outlined" style={styles.sessionCard}>
                  <View style={styles.sessionRow}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={accent.sky[500]}
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
