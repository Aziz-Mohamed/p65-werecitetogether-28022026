import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { ScoreInput } from '@/components/forms/ScoreInput';
import { TextField } from '@/components/ui/TextField';
import { LoadingState, ErrorState } from '@/components/feedback';
import { RevisionCard, useSessionRecitations } from '@/features/memorization';
import { useSessionById } from '@/features/sessions/hooks/useSessions';
import { useUpdateDraft, useDeleteDraft } from '@/features/sessions/hooks/useDraftSessions';
import { ProgramChip } from '@/features/sessions/components/ProgramChip';
import { DraftBadge } from '@/features/sessions/components/DraftBadge';
import { VoiceMemoPlayer, VoiceMemoPrompt, useVoiceMemo } from '@/features/voice-memos';
import { voiceMemoService } from '@/features/voice-memos/services/voice-memo.service';
import { formatSessionDate } from '@/lib/helpers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Session Detail Screen ───────────────────────────────────────────────────

export default function SessionDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: session, isLoading, error, refetch } = useSessionById(id);
  const { data: recitations = [] } = useSessionRecitations(id);
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();

  const { data: voiceMemo } = useVoiceMemo(id);

  const isDraft = (session as any)?.status === 'draft';
  const [showVoiceMemoPrompt, setShowVoiceMemoPrompt] = useState(true);

  // ── Draft editing state ──
  const [memScore, setMemScore] = useState<number | null>(null);
  const [tajScore, setTajScore] = useState<number | null>(null);
  const [recScore, setRecScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [draftInitialized, setDraftInitialized] = useState(false);

  // Initialize draft form values when session loads
  if (session && isDraft && !draftInitialized) {
    setMemScore(session.memorization_score);
    setTajScore(session.tajweed_score);
    setRecScore(session.recitation_quality);
    setNotes(session.notes ?? '');
    setDraftInitialized(true);
  }

  const handleSubmitDraft = useCallback(() => {
    if (!id) return;
    updateDraft.mutate(
      {
        sessionId: id,
        input: {
          memorization_score: memScore,
          tajweed_score: tajScore,
          recitation_quality: recScore,
          notes: notes || null,
          status: 'completed',
        },
      },
      {
        onSuccess: () => router.back(),
        onError: (err: Error) => Alert.alert(t('common.error'), err.message),
      },
    );
  }, [id, memScore, tajScore, recScore, notes, updateDraft, router, t]);

  const handleSaveDraft = useCallback(() => {
    if (!id) return;
    updateDraft.mutate(
      {
        sessionId: id,
        input: {
          memorization_score: memScore,
          tajweed_score: tajScore,
          recitation_quality: recScore,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => router.back(),
        onError: (err: Error) => Alert.alert(t('common.error'), err.message),
      },
    );
  }, [id, memScore, tajScore, recScore, notes, updateDraft, router, t]);

  const handleDeleteDraft = useCallback(() => {
    if (!id) return;
    Alert.alert(
      t('sessions.deleteDraft'),
      t('sessions.deleteDraftConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteDraft.mutate(id, {
              onSuccess: () => router.back(),
              onError: (err: Error) => Alert.alert(t('common.error'), err.message),
            });
          },
        },
      ],
    );
  }, [id, deleteDraft, router, t]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (!session) return <ErrorState description={t('common.noResults')} onRetry={refetch} />;

  const studentName = resolveName((session as any).student?.profiles?.name_localized, (session as any).student?.profiles?.full_name) ?? '—';

  // ── Draft editing mode ──
  if (isDraft) {
    return (
      <Screen scroll>
        <View style={styles.container}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />

          <View style={styles.draftHeader}>
            <Text style={styles.title}>{t('teacher.sessions.detailTitle')}</Text>
            <DraftBadge />
          </View>

          {/* Program */}
          {(session as any).programs && (
            <ProgramChip
              programName={(session as any).programs.name}
              programNameAr={(session as any).programs.name_ar}
            />
          )}

          {/* Student */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('teacher.sessions.student')}</Text>
            <Text style={styles.bodyText}>{studentName}</Text>
          </Card>

          {/* Editable Scores */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('teacher.sessions.scores')}</Text>
            <View style={styles.scoresEditGrid}>
              <ScoreInput
                label={t('teacher.sessions.memorization')}
                value={memScore}
                onChange={setMemScore}
              />
              <ScoreInput
                label={t('teacher.sessions.tajweed')}
                value={tajScore}
                onChange={setTajScore}
              />
              <ScoreInput
                label={t('teacher.sessions.recitation')}
                value={recScore}
                onChange={setRecScore}
              />
            </View>
          </Card>

          {/* Notes */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('teacher.sessions.notes')}</Text>
            <TextField
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder={t('common.optional')}
            />
          </Card>

          {/* Draft Actions */}
          <View style={styles.draftActions}>
            <Button
              title={t('sessions.submitSession')}
              onPress={handleSubmitDraft}
              variant="primary"
              size="lg"
              loading={updateDraft.isPending}
            />
            <View style={styles.draftSecondaryRow}>
              <Button
                title={t('sessions.saveDraft')}
                onPress={handleSaveDraft}
                variant="default"
                size="md"
                loading={updateDraft.isPending}
                style={styles.flex1}
              />
              <Button
                title={t('sessions.deleteDraft')}
                onPress={handleDeleteDraft}
                variant="ghost"
                size="md"
                loading={deleteDraft.isPending}
                style={styles.flex1}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  // ── Read-only completed session ──
  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Back */}
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        {/* Header */}
        <Text style={styles.title}>{t('teacher.sessions.detailTitle')}</Text>
        <Text style={styles.subtitle}>
          {formatSessionDate(session.session_date, i18n.language).date}{' '}
          <Text style={styles.subtitleWeekday}>({formatSessionDate(session.session_date, i18n.language).weekday})</Text>
        </Text>

        {/* Program */}
        {(session as any).programs && (
          <ProgramChip
            programName={(session as any).programs.name}
            programNameAr={(session as any).programs.name_ar}
          />
        )}

        {/* Student Info */}
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('teacher.sessions.student')}</Text>
          <Text style={styles.bodyText}>{studentName}</Text>
        </Card>

        {/* Scores */}
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionTitle}>{t('teacher.sessions.scores')}</Text>
          <View style={styles.scoresGrid}>
            <ScoreDisplay
              label={t('teacher.sessions.memorization')}
              value={session.memorization_score}
            />
            <ScoreDisplay
              label={t('teacher.sessions.tajweed')}
              value={session.tajweed_score}
            />
            <ScoreDisplay
              label={t('teacher.sessions.recitation')}
              value={session.recitation_quality}
            />
          </View>
        </Card>

        {/* Recitations */}
        {recitations.length > 0 && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Recitations</Text>
            {recitations.map((recitation: any) => (
              <RevisionCard
                key={recitation.id}
                item={{
                  progress_id: null,
                  surah_number: recitation.surah_number,
                  from_ayah: recitation.from_ayah,
                  to_ayah: recitation.to_ayah,
                  status: recitation.needs_repeat ? 'needs_review' : 'memorized',
                  review_type: recitation.recitation_type,
                  next_review_date: null,
                  last_reviewed_at: recitation.created_at,
                  review_count: 1,
                  ease_factor: 2.5,
                  avg_accuracy: recitation.accuracy_score,
                  avg_tajweed: recitation.tajweed_score,
                  avg_fluency: recitation.fluency_score,
                  first_memorized_at: null,
                }}
              />
            ))}
          </Card>
        )}

        {/* Notes */}
        {session.notes && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('teacher.sessions.notes')}</Text>
            <Text style={styles.bodyText}>{session.notes}</Text>
          </Card>
        )}

        {/* Voice Memo Player */}
        {voiceMemo && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>{t('voiceMemo.addVoiceMemo')}</Text>
            <VoiceMemoPlayer sessionId={id!} />
          </Card>
        )}

        {/* Voice Memo Prompt — for completed sessions < 24h with no memo */}
        {!voiceMemo && showVoiceMemoPrompt && session && voiceMemoService.canAttachMemo(session) && (
          <VoiceMemoPrompt
            sessionId={id!}
            studentName={studentName}
            onDismiss={() => setShowVoiceMemoPrompt(false)}
          />
        )}

        {/* Retroactive add button — shown when prompt was dismissed but memo still attachable */}
        {!voiceMemo && !showVoiceMemoPrompt && session && voiceMemoService.canAttachMemo(session) && (
          <Button
            title={t('voiceMemo.addVoiceMemo')}
            onPress={() => setShowVoiceMemoPrompt(true)}
            variant="default"
            size="md"
            icon={<Ionicons name="mic-outline" size={18} color={colors.primary[500]} />}
          />
        )}

      </View>
    </Screen>
  );
}

// ─── Score Display Helper ────────────────────────────────────────────────────

function ScoreDisplay({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>
        {value != null ? `${value}/5` : '—'}
      </Text>
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
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  subtitleWeekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  bodyText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  caption: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoresEditGrid: {
    gap: spacing.md,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  scoreValue: {
    ...typography.textStyles.heading,
    color: lightTheme.primary,
    fontSize: typography.fontSize.xl,
  },
  draftActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  draftSecondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
});
