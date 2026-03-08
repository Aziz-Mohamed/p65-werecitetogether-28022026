import React, { useState } from 'react';
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
import { useRatingPrompt } from '@/features/ratings/hooks/useRatingPrompt';
import { RatingPrompt } from '@/features/ratings/components/RatingPrompt';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { formatSessionDate } from '@/lib/helpers';
import { getSurah, formatVerseRange } from '@/lib/quran-metadata';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Student Session Detail ──────────────────────────────────────────────────

export default function StudentSessionDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useRoleTheme();

  const { data: session, isLoading, error, refetch } = useSessionById(id);
  const { data: recitations = [] } = useSessionRecitations(id);
  const { data: voiceMemo } = useVoiceMemo(id);
  const { canRate, alreadyRated } = useRatingPrompt(id, session?.status, session?.session_date);
  const [ratingOpen, setRatingOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (!session) return <ErrorState description={t('common.noResults')} onRetry={refetch} />;

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
          <Text style={styles.title}>{t('student.sessionDetail.title')}</Text>
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

        {/* Scores */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('student.sessionDetail.scores')}</Text>
          <View style={styles.scoresGrid}>
            <ScoreDisplay
              label={t('student.sessionDetail.memorization')}
              value={session.memorization_score}
              color={theme.primary}
            />
            <ScoreDisplay
              label={t('student.sessionDetail.tajweed')}
              value={session.tajweed_score}
              color={colors.accent.violet[500]}
            />
            <ScoreDisplay
              label={t('student.sessionDetail.recitation')}
              value={session.recitation_quality}
              color={colors.accent.sky[500]}
            />
          </View>
        </Card>

        {/* Recitations */}
        {recitations.length > 0 && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('student.sessionDetail.recitations')}</Text>
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
                          <Text style={styles.recitationScoreLabel}>{t('student.sessionDetail.accuracy')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.primary[600] }]}>{recitation.accuracy_score}/5</Text>
                        </View>
                      )}
                      {recitation.tajweed_score != null && (
                        <View style={styles.recitationScoreCell}>
                          <Text style={styles.recitationScoreLabel}>{t('student.sessionDetail.tajweed')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.accent.violet[600] }]}>{recitation.tajweed_score}/5</Text>
                        </View>
                      )}
                      {recitation.fluency_score != null && (
                        <View style={styles.recitationScoreCell}>
                          <Text style={styles.recitationScoreLabel}>{t('student.sessionDetail.fluency')}</Text>
                          <Text style={[styles.recitationScoreValue, { color: colors.accent.sky[600] }]}>{recitation.fluency_score}/5</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Footer: needs repeat + mistake notes */}
                  {recitation.needs_repeat && (
                    <View style={styles.recitationFooter}>
                      <Badge label={t('memorization.needsRepeat')} variant="warning" size="sm" />
                    </View>
                  )}
                  {recitation.mistake_notes && (
                    <Text style={styles.mistakeNotes}>{recitation.mistake_notes}</Text>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* Notes */}
        {session.notes && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('student.sessionDetail.notes')}</Text>
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

        {/* Rating */}
        {canRate && (
          <Button
            title={t('ratings.rateSession')}
            onPress={() => setRatingOpen(true)}
            icon={<Ionicons name="star-outline" size={18} color={colors.white} />}
            style={styles.rateButton}
          />
        )}
        {alreadyRated && (
          <View style={styles.ratedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
            <Text style={styles.ratedText}>{t('ratings.alreadyRated')}</Text>
          </View>
        )}

      </View>

      {canRate && (
        <RatingPrompt
          sessionId={id!}
          isOpen={ratingOpen}
          onClose={() => setRatingOpen(false)}
        />
      )}
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
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
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
  mistakeNotes: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    fontStyle: 'italic',
  },
  notesContainer: {
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: normalize(10),
    borderLeftWidth: 3,
    borderLeftColor: colors.neutral[200],
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
  rateButton: {
    marginTop: spacing.sm,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
    paddingVertical: spacing.sm,
  },
  ratedText: {
    ...typography.textStyles.caption,
    color: colors.primary[500],
    fontFamily: typography.fontFamily.semiBold,
  },
});
