import React from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { MemorizationProgressBar } from '@/features/memorization';
import { useTeacherStudentDetail } from '@/features/students/hooks/useTeacherStudentDetail';
import { useCertificationEligibility } from '@/features/certifications/hooks/useCertifications';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Teacher Student Detail Screen ──────────────────────────────────────────

export default function TeacherStudentDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();

  const detail = useTeacherStudentDetail(id, profile?.id);

  if (detail.isLoading) return <LoadingState />;
  if (detail.error) return <ErrorState description={(detail.error as Error).message} onRetry={detail.refetch} />;
  if (!detail.student) return null;

  const { studentProfile, studentClass } = detail;

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

        {/* Student Profile Card */}
        <Card variant="primary-glow" style={styles.profileCard}>
          <Avatar
            name={resolveName(studentProfile?.name_localized, studentProfile?.full_name)}
            size="xl"
            ring
            variant="indigo"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{resolveName(studentProfile?.name_localized, studentProfile?.full_name) ?? '—'}</Text>
            {studentClass?.name && (
              <Badge label={resolveName(studentClass.name_localized, studentClass.name) ?? studentClass.name} variant="sky" size="sm" />
            )}
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.sky[500] }]}>{Math.round(detail.attendanceRate)}%</Text>
            <Text style={styles.statLabel}>{t('navigation.attendance')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary[500] }]}>{detail.sessions.length}</Text>
            <Text style={styles.statLabel}>{t('teacher.insights.recentSessions')}</Text>
          </Card>
        </View>

        {/* Memorization Progress */}
        {detail.memStats && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('memorization.title')}</Text>
              <Button
                title={t('memorization.viewDetails')}
                onPress={() => router.push(`/(teacher)/students/${id}/memorization`)}
                variant="ghost"
                size="sm"
              />
            </View>
            <Card variant="default" style={styles.memorizationCard}>
              <MemorizationProgressBar stats={detail.memStats} compact />
              <View style={styles.memorizationActions}>
                <Button
                  title={t('memorization.assignHifz')}
                  onPress={() => router.push(`/(teacher)/assignments/create?studentId=${id}`)}
                  variant="secondary"
                  size="sm"
                  icon={<Ionicons name="add-circle-outline" size={16} color={theme.primary} />}
                />
              </View>
            </Card>
          </>
        )}

        {/* Certification Eligibility — shown when enrollment context is available */}
        {/* TODO: Wire enrollmentId from the student's active enrollment */}

        {/* Recent Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('teacher.insights.recentSessions')}</Text>
          <Badge label={String(detail.sessions.length)} variant="default" />
        </View>
        {detail.sessions.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('teacher.dashboard.noRecentSessions')}</Text>
          </Card>
        ) : (
          detail.sessions.map((session) => (
            <Card key={session.id} variant="default" style={styles.sessionCard}>
              <View style={styles.sessionRow}>
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.dateGroup}>
                    <Ionicons name="calendar" size={16} color={theme.primary} />
                    <Text style={styles.sessionDate}>
                      {formatSessionDate(session.session_date, i18n.language).date}{' '}
                      <Text style={styles.sessionWeekday}>({formatSessionDate(session.session_date, i18n.language).weekday})</Text>
                    </Text>
                  </View>
                  <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
                </View>

                <View style={styles.scoresRow}>
                  <ScoreItem label={t('teacher.sessions.memorization')} value={session.memorization_score} color={theme.primary} />
                  <ScoreItem label={t('teacher.sessions.tajweed')} value={session.tajweed_score} color={colors.accent.sky[500]} />
                  <ScoreItem label={t('teacher.sessions.recitation')} value={session.recitation_quality} color={colors.accent.violet[500]} />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

function ScoreItem({ label, value, color }: { label: string, value: number | null, color: string }) {
  if (value == null) return null;
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={[styles.scoreValueContainer, { backgroundColor: color + '10' }]}>
        <Text style={[styles.scoreValue, { color }]}>{value}/5</Text>
      </View>
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
  studentName: {
    ...typography.textStyles.heading,
    color: colors.neutral[900],
    fontSize: normalize(24),
  },
  statsGrid: {
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
    fontSize: normalize(24),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(4),
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
  },
  sessionRow: {
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
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: normalize(12),
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: normalize(9),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginBottom: normalize(4),
  },
  scoreValueContainer: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  scoreValue: {
    fontSize: normalize(12),
    fontFamily: typography.fontFamily.bold,
  },
  memorizationCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  memorizationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
