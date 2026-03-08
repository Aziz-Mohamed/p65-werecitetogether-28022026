import React from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge, Avatar } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useChildDetail } from '@/features/children/hooks/useChildren';
import { useAttendanceRate } from '@/features/attendance/hooks/useAttendance';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Child Detail Screen ─────────────────────────────────────────────────────

export default function ChildDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();

  const { data, isLoading, error, refetch } = useChildDetail(id);
  const { data: attendanceRate } = useAttendanceRate(id);
  const { data: memStats } = useMemorizationStats(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!data?.student) return <ErrorState description={t('admin.students.notFound')} />;

  const { student, recentSessions, stickerCount } = data;
  const classId = (student as any).classes?.id;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.primary} />}
          />
        </View>

        {/* Profile Header */}
        <Card variant="primary-glow" style={styles.profileCard}>
          <Avatar 
            name={resolveName((student as any).profiles?.name_localized, (student as any).profiles?.full_name)}
            size="xl" 
            ring 
            variant="indigo" // Child/Student is indigo
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{resolveName((student as any).profiles?.name_localized, (student as any).profiles?.full_name) ?? '—'}</Text>
            <View style={styles.metaRow}>
              <Badge
                label={resolveName((student as any).classes?.name_localized, (student as any).classes?.name) ?? t('admin.students.noClass')}
                variant="sky"
                size="sm"
              />
              <Badge
                label={`${t('common.level')} ${(student as any).current_level ?? 0}/240`}
                variant="indigo"
                size="sm"
              />
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label={t('common.level')} value={`${(student as any).current_level ?? 0}/240`} color={colors.primary[500]} />
          <StatCard label={t('student.streak')} value={student.current_streak} color={colors.accent.rose[500]} />
          <StatCard label={t('navigation.stickers')} value={stickerCount} color={colors.accent.violet[500]} />
          <StatCard label={t('dashboard.attendanceRate')} value={`${attendanceRate?.rate ?? '—'}%`} color={colors.accent.sky[500]} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actions}>
          <Button
            title={t('parent.viewAttendance')}
            onPress={() => router.push(`/(parent)/attendance/${id}`)}
            variant="ghost"
            size="md"
            icon={<Ionicons name="calendar" size={18} color={theme.primary} />}
            style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}
          />
          <Button
            title={t('reports.viewProgress')}
            onPress={() => router.push(`/(parent)/progress/${id}`)}
            variant="ghost"
            size="md"
            icon={<Ionicons name="bar-chart" size={18} color={colors.accent.indigo[500]} />}
            style={[styles.actionButton, { backgroundColor: colors.accent.indigo[50] }]}
          />
          {memStats && (
            <Button
              title={t('student.tabs.memorization')}
              onPress={() => router.push(`/(parent)/memorization/${id}`)}
              variant="ghost"
              size="md"
              icon={<Ionicons name="book" size={18} color={colors.accent.violet[500]} />}
              style={[styles.actionButton, { backgroundColor: colors.accent.violet[50] }]}
            />
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('parent.recentSessions')}</Text>
          <Badge label={String(recentSessions?.length ?? 0)} variant="default" />
        </View>
        {!recentSessions || recentSessions.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('student.sessions.emptyDescription')}</Text>
          </Card>
        ) : (
          recentSessions.map((session: any) => (
            <Card key={session.id} variant="default" onPress={() => router.push(`/(parent)/sessions/${session.id}`)} style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <View style={styles.dateGroup}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={styles.sessionDate}>
                    {formatSessionDate(session.session_date, i18n.language).date}{' '}
                    <Text style={styles.sessionWeekday}>({formatSessionDate(session.session_date, i18n.language).weekday})</Text>
                  </Text>
                </View>
                <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
              </View>
              
              <View style={styles.scoresRow}>
                <ScoreBadge label={t('common.scoreAbbrev.memorization')} value={session.memorization_score} max={5} />
                <ScoreBadge label={t('common.scoreAbbrev.tajweed')} value={session.tajweed_score} max={5} />
                <ScoreBadge label={t('common.scoreAbbrev.recitation')} value={session.recitation_quality} max={5} />
              </View>

              {session.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.sessionNotes}>{session.notes}</Text>
                </View>
              )}
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <Card variant="default" style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function ScoreBadge({ label, value, max }: { label: string, value: number | null, max: number }) {
  if (value == null) return null;
  const isHigh = value >= (max * 0.8);
  return (
    <View style={[styles.scoreBadge, { backgroundColor: isHigh ? colors.primary[50] : colors.neutral[50] }]}>
      <Text style={styles.scoreLabel}>{label}:</Text>
      <Text style={[styles.scoreValue, { color: isHigh ? colors.primary[600] : colors.neutral[600] }]}>{value}/{max}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.heading,
    color: colors.neutral[900],
    fontSize: normalize(24),
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(24),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(4),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  actionButton: {
    borderRadius: normalize(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: colors.neutral[800],
    fontSize: normalize(18),
  },
  sessionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionDate: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  sessionWeekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  scoreLabel: {
    fontSize: normalize(10),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
  },
  scoreValue: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.bold,
  },
  notesContainer: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: normalize(8),
    borderStartWidth: 3,
    borderStartColor: colors.neutral[200],
  },
  sessionNotes: {
    ...typography.textStyles.caption,
    color: colors.neutral[600],
    fontStyle: 'italic',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.neutral[400],
  },
});
