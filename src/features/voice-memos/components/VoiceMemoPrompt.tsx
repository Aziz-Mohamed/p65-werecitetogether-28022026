import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { VoiceMemoRecorder } from './VoiceMemoRecorder';
import { useUploadVoiceMemo } from '../hooks/useUploadVoiceMemo';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface VoiceMemoPromptProps {
  sessionId: string;
  studentName: string;
  onDismiss: () => void;
}

export function VoiceMemoPrompt({ sessionId, studentName, onDismiss }: VoiceMemoPromptProps) {
  const { t } = useTranslation();
  const [showRecorder, setShowRecorder] = useState(false);
  const uploadMemo = useUploadVoiceMemo();

  const handleRecordingComplete = useCallback(
    async (fileUri: string, durationSeconds: number) => {
      uploadMemo.mutate(
        { sessionId, fileUri, durationSeconds },
        {
          onSuccess: () => {
            Toast.show({
              type: 'success',
              text1: t('voiceMemo.uploadSuccess'),
            });
            onDismiss();
          },
          onError: () => {
            Toast.show({
              type: 'error',
              text1: t('voiceMemo.uploadFailed'),
            });
            onDismiss();
          },
        },
      );
    },
    [sessionId, uploadMemo, onDismiss, t],
  );

  if (showRecorder) {
    return (
      <View style={styles.recorderContainer}>
        <VoiceMemoRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => {
            setShowRecorder(false);
            onDismiss();
          }}
        />
        {uploadMemo.isPending && (
          <View style={styles.uploadingRow}>
            <Text style={styles.uploadingText}>{t('voiceMemo.uploading')}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.promptContainer}>
      <Ionicons name="mic-outline" size={28} color={colors.primary[500]} />
      <Text style={styles.promptText}>
        {t('voiceMemo.recordPrompt', { name: studentName })}
      </Text>
      <View style={styles.promptActions}>
        <Pressable
          style={styles.recordPromptButton}
          onPress={() => setShowRecorder(true)}
          accessibilityLabel={t('voiceMemo.record')}
        >
          <Ionicons name="mic" size={20} color={colors.white} />
          <Text style={styles.recordPromptText}>{t('voiceMemo.record')}</Text>
        </Pressable>
        <Pressable
          style={styles.skipButton}
          onPress={onDismiss}
          accessibilityLabel={t('voiceMemo.skip')}
        >
          <Text style={styles.skipText}>{t('voiceMemo.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  promptContainer: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  promptText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(15),
    color: colors.neutral[700],
    textAlign: 'center',
  },
  promptActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  recordPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
  },
  recordPromptText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(14),
    color: colors.neutral[500],
  },
  recorderContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  uploadingRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
  },
  uploadingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.primary[600],
  },
});
