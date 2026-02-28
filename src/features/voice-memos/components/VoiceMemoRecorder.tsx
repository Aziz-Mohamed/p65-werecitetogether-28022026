import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useUploadVoiceMemo } from '../hooks/useVoiceMemos';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { UploadVoiceMemoInput } from '../types';

interface VoiceMemoRecorderProps {
  sessionId: string;
  studentId: string;
  teacherId: string;
  programId: string;
  onComplete: () => void;
}

export function VoiceMemoRecorder({
  sessionId,
  studentId,
  teacherId,
  programId,
  onComplete,
}: VoiceMemoRecorderProps) {
  const { t } = useTranslation();
  const recorder = useAudioRecorder();
  const upload = useUploadVoiceMemo();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSend = useCallback(async () => {
    if (!recorder.uri) return;

    const input: UploadVoiceMemoInput = {
      sessionId,
      studentId,
      teacherId,
      programId,
      fileUri: recorder.uri,
      durationSeconds: recorder.durationSeconds,
      fileSizeBytes: 0, // Will be determined server-side
    };

    await upload.mutateAsync(input);
    onComplete();
  }, [recorder.uri, recorder.durationSeconds, sessionId, studentId, teacherId, programId, upload, onComplete]);

  return (
    <View style={styles.container}>
      {/* Timer */}
      <View style={styles.timerContainer}>
        {recorder.isRecording ? (
          <>
            <View style={styles.recordingDot} />
            <Text style={styles.timer}>{formatTime(recorder.durationSeconds)}</Text>
            <Text style={styles.remaining}>
              {t('voiceMemos.maxDuration', { seconds: recorder.remainingSeconds })}
            </Text>
          </>
        ) : recorder.uri ? (
          <Text style={styles.timer}>{formatTime(recorder.durationSeconds)}</Text>
        ) : (
          <Text style={styles.instruction}>{t('voiceMemos.record')}</Text>
        )}
      </View>

      {/* Controls */}
      {!recorder.uri ? (
        <Pressable
          onPress={recorder.isRecording ? recorder.stopRecording : recorder.startRecording}
          style={[styles.recordButton, recorder.isRecording && styles.recordButtonActive]}
          accessibilityLabel={
            recorder.isRecording ? t('voiceMemos.stopRecording') : t('voiceMemos.record')
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={recorder.isRecording ? 'stop' : 'mic'}
            size={32}
            color="#fff"
          />
        </Pressable>
      ) : (
        <View style={styles.actionRow}>
          <Button
            title={t('voiceMemos.reRecord')}
            onPress={recorder.reset}
            variant="ghost"
            size="sm"
          />
          <Button
            title={t('voiceMemos.send')}
            onPress={handleSend}
            variant="primary"
            size="sm"
            loading={upload.isPending}
          />
        </View>
      )}

      {recorder.error && (
        <Text style={styles.errorText}>{recorder.error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBlock: spacing.xl,
  },
  timerContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  recordingDot: {
    width: normalize(12),
    height: normalize(12),
    borderRadius: normalize(6),
    backgroundColor: accent.red[500],
  },
  timer: {
    ...typography.textStyles.display,
    color: lightTheme.text,
    fontSize: normalize(36),
  },
  remaining: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
  instruction: {
    ...typography.textStyles.body,
    color: neutral[500],
  },
  recordButton: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  },
  recordButtonActive: {
    backgroundColor: accent.red[500],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: accent.red[500],
  },
});
