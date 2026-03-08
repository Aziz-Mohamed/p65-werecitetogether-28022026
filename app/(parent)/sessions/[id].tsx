import React from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useSessionRecitations } from '@/features/memorization';
import { RecitationTypeChip } from '@/features/memorization/components/RecitationTypeChip';
import { useSessionById } from '@/features/sessions/hooks/useSessions';
import { ProgramChip } from '@/features/sessions/components/ProgramChip';
import { VoiceMemoPlayer, useVoiceMemo } from '@/features/voice-memos';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { getSurah, formatVerseRange } from '@/lib/quran-metadata';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Parent Session Detail ──────────────────────────────────────────────────

export default function ParentSessionDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();

  const { data: session, isLoading, error, refetch } = useSessionById(id);
  const { data: recitations = [] } = useSessionRecitations(id);
  const { data: voiceMemo } = useVoiceMemo(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (!session) return <ErrorState description={t('common.noResults')} onRetry={refetch} />;

  const teacherName = resolveName((session as any).teacher?.name_localized, (session as any).teacher?.full_name) ?? '—';

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.primary} />}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('parent.sessionDetail.title')}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.neutral[400]} />
            <Text style={styles.dateText}>
              {formatSessionDate(session.session_date, i18n.language).date}{' '}
              <Text style={styles.dateWeekday}>({formatSessionDate(session.session_date, i18n.language).weekday})</Text>
            </Text>
          </View>
        </View>

        {/* Program */}
        {(session as any).programs && (
          <ProgramChip
            programName={(session as any).programs.name}
            programNameAr={(session as any).programs.name_ar}
          />
        )}

        {/* Teacher */}
        <Card variant="glass" style={styles.section}>
          <View style={styles.teacherRow}>
            <View style={[styles.teacherIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={styles.teacherInfo}>
              <Text style={styles.sectionLabel}>{t('parent.sessionDetail.teacher')}</Text>
              <Text style={styles.teacherName}>{teacherName}</Text>
            </View>
          </View>
        </Card>

        {/* Scores */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('parent.sessionDetail.scores')}</Text>
          <View style={styles.scoresGrid}>
            <ScoreDisplay
              label={t('parent.sessionDetail.memorization')}
              value={session.memorization_score}
              color={theme.primary}
            />
            <ScoreDisplay
              label={t('parent.sessionDetail.tajweed')}
              value={session.tajweed_score}
              color={colors.accent.violet[500]}
            />
            <ScoreDisplay
              label={t('parent.sessionDetail.recitation')}
              value={session.recitation_quality}
              color={colors.accent.sky[500]}
            />
          </View>
        </Card>

        {/* Recitations */}
        {recitations.length > 0 && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('parent.sessionDetail.recitations')}</Text>
            {recitations.map((recitation: any) => {
              const surah = getSurah(recitation.surah_number);
              const range = formatVerseRange(recitation.surah_number, recitation.from_ayah, recitation.to_ayah, i18n.language as 'ar' | 'en');
              const hasScores = recitation.accuracy_score != null || recitation.tajweed_score != null || recitation.fluency_score != null;
              return (
                <View key={recitation.id} style={styles.recitationCard}>
                  {/* Row 1: Surah name + type chip */}
                  <View style={styles.recitationTopRow}>
                    <Text style={styles.recitationSurah} numberOfLines={1}>
                      {surah?.nameArabic ?? ''} - {surah?.nameEnglish ?? ''}
                    </Text>
                    <RecitationTypeChip type={recitation.recitation_type} />
                  </View>

                  {/* Row 2: Verse range */}
                  <Text style={styles.recitationRange}>{range}</Text>

                  {/* Row 3: Scores in even grid */}
                  {hasScores && (
                    <View style={styles.recitationScoresGrid}>
                      {recitation.accuracy_score != null && (
                        <View style={styles.recitationScoreCell}>
                          <Text style={styles.recitationScoreLabel}>{t('parent.sessionDetail.memorization')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.primary[600] }]}>{recitation.accuracy_score}/5</Text>
                        </View>
                      )}
                      {recitation.tajweed_score != null && (
                        <View style={styles.recitationScoreCell}>
                          <Text style={styles.recitationScoreLabel}>{t('parent.sessionDetail.tajweed')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.accent.violet[600] }]}>{recitation.tajweed_score}/5</Text>
                        </View>
                      )}
                      {recitation.fluency_score != null && (
                        <View style={styles.recitationScoreCell}>
                          <Text style={styles.recitationScoreLabel}>{t('parent.sessionDetail.recitation')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.accent.sky[600] }]}>{recitation.fluency_score}/5</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Footer: needs repeat */}
                  {recitation.needs_repeat && (
                    <View style={styles.recitationFooter}>
                      <Badge label={t('memorization.needsRepeat')} variant="warning" size="sm" />
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* Notes */}
        {session.notes && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('parent.sessionDetail.notes')}</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </Card>
        )}

        {/* Voice Memo */}
        {voiceMemo && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('voiceMemo.addVoiceMemo')}</Text>
            <VoiceMemoPlayer sessionId={id!} />
          </Card>
        )}

      </View>
    </Screen>
  );
}

// ─── Score Display Helper ────────────────────────────────────────────────────

function ScoreDisplay({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (value == null) {
    return (
      <View style={styles.scoreItem}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={[styles.scoreValue, { color: colors.neutral[300] }]}>—</Text>
      </View>
    );
  }
  const isHigh = value >= 4;
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={[styles.scoreValueContainer, { backgroundColor: isHigh ? colors.primary[50] : colors.neutral[50] }]}>
        <Text style={[styles.scoreValue, { color: isHigh ? colors.primary[600] : color }]}>{value}/5</Text>
      </View>
    </View>
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
    gap: normalize(4),
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  dateText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
  },
  dateWeekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  section: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    fontSize: normalize(16),
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: {
    flex: 1,
    gap: normalize(2),
  },
  teacherName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    fontSize: normalize(16),
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  scoreValueContainer: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(10),
  },
  scoreValue: {
    ...typography.textStyles.heading,
    fontSize: normalize(20),
  },
  recitationCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: normalize(10),
    padding: spacing.sm,
    gap: spacing.xs,
  },
  recitationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recitationSurah: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: lightTheme.text,
    flex: 1,
  },
  recitationRange: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.primary[600],
  },
  recitationScoresGrid: {
    flexDirection: 'row',
    marginTop: normalize(4),
    backgroundColor: colors.white,
    borderRadius: normalize(8),
    padding: spacing.xs,
  },
  recitationScoreCell: {
    flex: 1,
    alignItems: 'center',
    gap: normalize(2),
  },
  recitationScoreLabel: {
    fontSize: normalize(10),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[400],
  },
  recitationScoreValue: {
    fontSize: normalize(13),
    fontFamily: typography.fontFamily.bold,
  },
  recitationFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  notesContainer: {
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: normalize(10),
    borderStartWidth: 3,
    borderStartColor: colors.neutral[200],
  },
  notesText: {
    ...typography.textStyles.body,
    color: colors.neutral[700],
    fontStyle: 'italic',
  },
  caption: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
