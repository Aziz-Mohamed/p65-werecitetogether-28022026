import React from 'react';
import { Alert, I18nManager, Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { RubProgressMap } from '@/features/gamification/components/RubProgressMap';
import { RevisionSheet } from '@/features/gamification/components/RevisionSheet';
import { MemorizationProgressBar } from '@/features/memorization';
import { useTeacherStudentDetail } from '@/features/students/hooks/useTeacherStudentDetail';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors, semantic, semanticSurface } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
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
            <View style={styles.metaRow}>
              {studentClass?.name && (
                <Badge label={resolveName(studentClass.name_localized, studentClass.name) ?? studentClass.name} variant="sky" size="sm" />
              )}
              <Badge label={`${t('common.level')} ${detail.activeCount}/240`} variant="indigo" size="sm" />
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary[500] }]}>{detail.activeCount}/240</Text>
            <Text style={styles.statLabel}>{t('common.level')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.rose[500] }]}>{detail.student.current_streak ?? 0}</Text>
            <Text style={styles.statLabel}>{t('student.streak')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{detail.stickers.length}</Text>
            <Text style={styles.statLabel}>{t('navigation.stickers')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.sky[500] }]}>{Math.round(detail.attendanceRate)}%</Text>
            <Text style={styles.statLabel}>{t('navigation.attendance')}</Text>
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

        {/* Revision Homework */}
        {detail.homeworkItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('student.revision.revisionHomework')}</Text>
              <Badge label={String(detail.homeworkItems.length)} variant="warning" />
            </View>
            <Card variant="default" style={styles.homeworkCard}>
              {detail.homeworkItems.map((item) => (
                <View key={item.assignmentId} style={styles.homeworkRow}>
                  <View style={styles.homeworkInfo}>
                    <Text style={styles.homeworkTitle}>
                      {t('gamification.rub')} {item.rubNumber} {'\u00B7'} {t('gamification.juz')} {item.juz}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.homeworkAction, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      detail.completeHomework.mutate(item.assignmentId, {
                        onSuccess: () => {
                          Alert.alert('', t('student.revision.homeworkCompleted'));
                        },
                      });
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.semantic.success} />
                    <Text style={styles.homeworkActionText}>{t('student.revision.markRecited')}</Text>
                  </Pressable>
                </View>
              ))}
            </Card>
          </>
        )}

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

        {/* Rubʿ Progress Map */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('gamification.progressMap')}</Text>
        </View>
        <View style={styles.progressMapContainer}>
          <RubProgressMap
            studentId={id!}
            mode="interactive"
            onCertify={detail.handleCertify}
            onCertifiedRubPress={detail.handleCertifiedRubPress}
            onJuzAction={detail.handleJuzAction}
          />
        </View>

        {/* Revision Sheet */}
        <RevisionSheet
          mode="teacher"
          visible={!!detail.revisionCert}
          certification={detail.revisionCert}
          reference={detail.revisionCert ? detail.rubReferenceMap.get(detail.revisionCert.rub_number) ?? null : null}
          onAction={detail.handleRevisionAction}
          onClose={detail.closeRevisionSheet}
        />

        {/* Undo Banner */}
        {detail.undo.data && (
          <View style={styles.undoBanner}>
            <Text style={styles.undoText}>
              {t('gamification.certifiedSuccess', { rub: detail.undo.data.rubNumber })}
            </Text>
            <Pressable onPress={detail.handleUndo} style={styles.undoButton}>
              <Text style={styles.undoButtonText}>{t('common.undo')}</Text>
            </Pressable>
          </View>
        )}

        {/* Sticker History */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <Text style={styles.sectionTitle}>{t('teacher.insights.stickerHistory')}</Text>
          <Badge label={String(detail.stickers.length)} variant="default" />
        </View>
        {detail.stickers.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('student.stickers.emptyDescription')}</Text>
          </Card>
        ) : (
          detail.stickers.slice(0, 5).map((sticker) => (
            <Card key={sticker.id} variant="glass" style={styles.stickerCard}>
              <View style={styles.stickerRow}>
                <View style={styles.stickerIconContainer}>
                  <Ionicons name="star" size={20} color={colors.gamification.gold} />
                </View>
                <View style={styles.stickerInfo}>
                  <Text style={styles.stickerName}>
                    {sticker.stickers?.name_en ?? '—'}
                  </Text>
                  {sticker.reason && (
                    <Text style={styles.stickerReason}>{sticker.reason}</Text>
                  )}
                </View>
                <View style={styles.tierLabel}>
                  <Text style={styles.stickerTier}>
                    {sticker.stickers?.tier ?? ''}
                  </Text>
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
  stickerCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stickerIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: semanticSurface.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerInfo: {
    flex: 1,
  },
  stickerName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  stickerReason: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  tierLabel: {
    backgroundColor: colors.neutral[50],
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  stickerTier: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  memorizationCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  memorizationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  progressMapContainer: {
    minHeight: normalize(400),
  },
  undoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[50],
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  undoText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[800],
    flex: 1,
  },
  undoButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xs,
    backgroundColor: colors.primary[500],
  },
  undoButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(13),
    color: colors.white,
  },
  homeworkCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  homeworkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  homeworkInfo: {
    flex: 1,
  },
  homeworkTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.neutral[800],
  },
  homeworkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.semantic.success + '15',
    borderRadius: radius.sm,
  },
  homeworkActionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
    color: colors.semantic.success,
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
