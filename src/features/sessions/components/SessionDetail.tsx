import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { VoiceMemoPlayer } from '@/features/voice-memos/components/VoiceMemoPlayer';
import { useSessionById } from '../hooks/useSessions';
import { useVoiceMemoForSession } from '@/features/voice-memos/hooks/useVoiceMemos';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface SessionDetailProps {
  sessionId: string;
  viewerRole: 'teacher' | 'student';
  viewerStudentId?: string;
}

const STATUS_BADGE: Record<string, 'success' | 'info' | 'default' | 'error'> = {
  completed: 'success',
  in_progress: 'info',
  draft: 'default',
  cancelled: 'error',
};

export function SessionDetail({ sessionId, viewerRole, viewerStudentId }: SessionDetailProps) {
  const { t } = useTranslation();
  const { data: session, isLoading } = useSessionById(sessionId);

  if (isLoading || !session) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const badgeVariant = STATUS_BADGE[session.status] ?? 'default';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date(session.created_at).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Badge label={t(`sessions.${session.status}`)} variant={badgeVariant} size="md" />
      </View>

      {/* Duration */}
      {session.duration_minutes != null && (
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color={neutral[400]} />
          <Text style={styles.metaText}>
            {t('sessions.durationMinutes', { minutes: session.duration_minutes })}
          </Text>
        </View>
      )}

      {/* Teacher Info */}
      {session.teacher_profile && (
        <Card variant="default" style={styles.teacherCard}>
          <View style={styles.teacherRow}>
            <Avatar
              name={session.teacher_profile.display_name ?? session.teacher_profile.full_name}
              source={session.teacher_profile.avatar_url ?? undefined}
              size="md"
            />
            <Text style={styles.teacherName}>
              {session.teacher_profile.display_name ?? session.teacher_profile.full_name}
            </Text>
          </View>
        </Card>
      )}

      {/* Notes */}
      {session.notes && (
        <Card variant="outlined" style={styles.notesCard}>
          <Text style={styles.notesLabel}>{t('sessions.sessionNotes')}</Text>
          <Text style={styles.notesText}>{session.notes}</Text>
        </Card>
      )}

      {/* Attendance / Scores */}
      {session.attendance && session.attendance.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sessions.attendance')}</Text>
          {session.attendance.map((entry) => {
            if (viewerRole === 'student' && entry.student_id !== viewerStudentId) return null;
            return (
              <View key={entry.id} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>
                  {viewerRole === 'teacher' ? entry.student_id.slice(0, 8) : t('sessions.score')}
                </Text>
                {entry.score != null && (
                  <Text style={styles.scoreValue}>{entry.score}/5</Text>
                )}
                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
                <VoiceMemoSection
                  sessionId={sessionId}
                  studentId={entry.student_id}
                />
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function VoiceMemoSection({ sessionId, studentId }: { sessionId: string; studentId: string }) {
  const { data: memo } = useVoiceMemoForSession(sessionId, studentId);

  if (!memo) return null;

  return (
    <VoiceMemoPlayer
      storagePath={memo.storage_path}
      expiresAt={memo.expires_at}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loading: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.body,
    color: neutral[500],
  },
  teacherCard: {
    padding: spacing.md,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  notesCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  notesLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
  },
  notesText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  scoreRow: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: neutral[100],
  },
  scoreLabel: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  scoreValue: {
    ...typography.textStyles.bodyMedium,
    color: primary[600],
  },
  entryNotes: {
    ...typography.textStyles.caption,
    color: neutral[400],
    fontStyle: 'italic',
  },
});
