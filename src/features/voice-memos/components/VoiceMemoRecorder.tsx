import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface VoiceMemoRecorderProps {
  onRecordingComplete: (fileUri: string, durationSeconds: number) => void;
  onCancel: () => void;
}

const MAX_DURATION_S = 120;
const WARNING_THRESHOLD_S = 15;

export function VoiceMemoRecorder({ onRecordingComplete, onCancel }: VoiceMemoRecorderProps) {
  const { t } = useTranslation();
  const {
    isRecording,
    durationMs,
    meteringLevels,
    fileUri,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const durationSeconds = Math.floor(durationMs / 1000);
  const remainingSeconds = MAX_DURATION_S - durationSeconds;
  const isWarning = remainingSeconds <= WARNING_THRESHOLD_S && isRecording;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopAndPreview = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const handleSend = useCallback(() => {
    if (fileUri) {
      onRecordingComplete(fileUri, Math.ceil(durationMs / 1000));
    }
  }, [fileUri, durationMs, onRecordingComplete]);

  const handleReRecord = useCallback(async () => {
    await cancelRecording();
  }, [cancelRecording]);

  // Permission denied state
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <Ionicons name="mic-off-outline" size={32} color={colors.neutral[400]} />
        <Text style={styles.permissionText}>{t('voiceMemo.micPermissionDenied')}</Text>
      </View>
    );
  }

  // Preview mode (recording done, file available)
  if (fileUri && !isRecording) {
    return (
      <View style={styles.container}>
        <Text style={styles.durationText}>{formatTime(durationSeconds)}</Text>
        <View style={styles.previewActions}>
          <Pressable
            style={styles.actionButton}
            onPress={handleReRecord}
            accessibilityLabel={t('voiceMemo.reRecord')}
          >
            <Ionicons name="refresh" size={24} color={colors.neutral[600]} />
            <Text style={styles.actionText}>{t('voiceMemo.reRecord')}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.sendButton]}
            onPress={handleSend}
            accessibilityLabel={t('voiceMemo.send')}
          >
            <Ionicons name="send" size={24} color={colors.white} />
            <Text style={[styles.actionText, styles.sendText]}>{t('voiceMemo.send')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Waveform */}
      {isRecording && (
        <View style={styles.waveform}>
          {meteringLevels.slice(-30).map((level, index) => (
            <WaveformBar key={index} level={level} />
          ))}
        </View>
      )}

      {/* Timer */}
      <Text style={[styles.timerText, isWarning && styles.timerWarning]}>
        {isRecording ? formatTime(remainingSeconds) : formatTime(0)}
      </Text>
      {isWarning && (
        <Text style={styles.warningText}>{t('voiceMemo.warning15s')}</Text>
      )}

      {/* Record / Stop Button */}
      <View style={styles.controlRow}>
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityLabel={t('common.cancel')}
        >
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </Pressable>

        <Pressable
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? handleStopAndPreview : startRecording}
          accessibilityLabel={isRecording ? t('common.done') : t('voiceMemo.record')}
          accessibilityRole="button"
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={28}
            color={colors.white}
          />
        </Pressable>

        <View style={styles.cancelButton} />
      </View>
    </View>
  );
}

// ─── Waveform Bar ──────────────────────────────────────────────────────────

function WaveformBar({ level }: { level: number }) {
  // Map dBFS (-160 to 0) to height (4 to 40)
  const normalized = Math.max(0, Math.min(1, (level + 160) / 160));
  const height = 4 + normalized * 36;

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(height, { duration: 100 }),
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(44),
    gap: normalize(2),
    paddingHorizontal: spacing.md,
  },
  bar: {
    width: normalize(3),
    backgroundColor: colors.primary[400],
    borderRadius: normalize(2),
    minHeight: normalize(4),
  },
  timerText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(32),
    color: colors.neutral[700],
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: colors.semantic.warning,
  },
  warningText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.semantic.warning,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    width: '100%',
  },
  recordButton: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: colors.neutral[700],
  },
  cancelButton: {
    width: normalize(60),
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(14),
    color: colors.neutral[500],
  },
  durationText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(24),
    color: colors.neutral[700],
    fontVariant: ['tabular-nums'],
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  sendButton: {
    backgroundColor: colors.primary[500],
  },
  actionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(14),
    color: colors.neutral[600],
  },
  sendText: {
    color: colors.white,
  },
  permissionText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
