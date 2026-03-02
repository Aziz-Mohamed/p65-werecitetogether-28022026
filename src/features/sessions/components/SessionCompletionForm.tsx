import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useCompleteSession, useLogAttendance } from '../hooks/useSessions';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface StudentEntry {
  studentId: string;
  name: string;
  avatarUrl?: string;
  attended: boolean;
  score: number;
  notes: string;
}

interface SessionCompletionFormProps {
  sessionId: string;
  students: { id: string; name: string; avatarUrl?: string }[];
  onComplete: () => void;
  onRecordMemo?: (studentId: string) => void;
}

export function SessionCompletionForm({
  sessionId,
  students,
  onComplete,
  onRecordMemo,
}: SessionCompletionFormProps) {
  const { t } = useTranslation();
  const completeSession = useCompleteSession();
  const logAttendance = useLogAttendance();

  const [entries, setEntries] = useState<StudentEntry[]>(
    students.map((s) => ({
      studentId: s.id,
      name: s.name,
      avatarUrl: s.avatarUrl,
      attended: true,
      score: 3,
      notes: '',
    })),
  );
  const [sessionNotes, setSessionNotes] = useState('');

  const toggleAttendance = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, attended: !e.attended } : e)),
    );
  }, []);

  const updateScore = useCallback((index: number, score: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, score } : e)),
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const attendedEntries = entries.filter((e) => e.attended);

    if (attendedEntries.length > 0) {
      await logAttendance.mutateAsync({
        sessionId,
        entries: attendedEntries.map((e) => ({
          studentId: e.studentId,
          score: e.score,
          notes: e.notes || undefined,
        })),
      });
    }

    await completeSession.mutateAsync({
      sessionId,
      notes: sessionNotes || undefined,
    });

    onComplete();
  }, [entries, sessionId, sessionNotes, logAttendance, completeSession, onComplete]);

  const isSubmitting = completeSession.isPending || logAttendance.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('sessions.complete')}</Text>

      {/* Student Attendance List */}
      <Text style={styles.sectionTitle}>{t('sessions.attendance')}</Text>
      {entries.map((entry, index) => (
        <Card key={entry.studentId} variant="outlined" style={styles.studentCard}>
          <View style={styles.studentRow}>
            <Pressable
              onPress={() => toggleAttendance(index)}
              style={styles.checkbox}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: entry.attended }}
            >
              <Ionicons
                name={entry.attended ? 'checkbox' : 'square-outline'}
                size={24}
                color={entry.attended ? primary[500] : neutral[300]}
              />
            </Pressable>

            <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size="sm" />

            <Text style={[styles.studentName, !entry.attended && styles.dimmed]} numberOfLines={1}>
              {entry.name}
            </Text>

            {onRecordMemo && entry.attended && (
              <Pressable
                onPress={() => onRecordMemo(entry.studentId)}
                accessibilityLabel={t('voiceMemos.record')}
              >
                <Ionicons name="mic-outline" size={22} color={primary[500]} />
              </Pressable>
            )}
          </View>

          {entry.attended && (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{t('sessions.score')}</Text>
              <View style={styles.scoreButtons}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Pressable
                    key={score}
                    onPress={() => updateScore(index, score)}
                    style={[
                      styles.scoreButton,
                      entry.score === score && styles.scoreButtonActive,
                    ]}
                    accessibilityLabel={`${t('sessions.score')} ${score}`}
                  >
                    <Text
                      style={[
                        styles.scoreText,
                        entry.score === score && styles.scoreTextActive,
                      ]}
                    >
                      {score}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Card>
      ))}

      {/* Session Notes */}
      <Text style={styles.sectionTitle}>{t('sessions.sessionNotes')}</Text>
      <TextInput
        style={styles.notesInput}
        value={sessionNotes}
        onChangeText={setSessionNotes}
        placeholder={t('sessions.notesPlaceholder')}
        placeholderTextColor={neutral[400]}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Button
        title={t('sessions.complete')}
        onPress={handleSubmit}
        variant="primary"
        loading={isSubmitting}
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  studentCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    padding: spacing.xs,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  dimmed: {
    opacity: 0.4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginInlineStart: normalize(44),
  },
  scoreLabel: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scoreButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonActive: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  scoreText: {
    ...typography.textStyles.label,
    color: neutral[600],
  },
  scoreTextActive: {
    color: '#fff',
  },
  notesInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: normalize(80),
    backgroundColor: lightTheme.surfaceElevated,
  },
});
