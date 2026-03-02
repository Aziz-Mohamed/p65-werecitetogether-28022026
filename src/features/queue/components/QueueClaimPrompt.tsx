import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useClaimQueueSlot } from '../hooks/useQueue';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface QueueClaimPromptProps {
  queueEntryId: string;
  studentId: string;
  programId: string;
  expiresAt: string;
  onClaimed: () => void;
  onExpired: () => void;
}

export function QueueClaimPrompt({
  queueEntryId,
  studentId,
  programId,
  expiresAt,
  onClaimed,
  onExpired,
}: QueueClaimPromptProps) {
  const { t } = useTranslation();
  const claimSlot = useClaimQueueSlot();
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onExpired();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onExpired]);

  const handleClaim = useCallback(async () => {
    await claimSlot.mutateAsync({
      queueEntryId,
      studentId,
      programId,
    });
    onClaimed();
  }, [queueEntryId, studentId, programId, claimSlot, onClaimed]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = remainingSeconds < 60;

  return (
    <Card variant="primary-glow" style={styles.card}>
      <Ionicons
        name="notifications"
        size={normalize(40)}
        color={primary[500]}
      />

      <Text style={styles.title}>{t('queue.teacherAvailable')}</Text>
      <Text style={styles.subtitle}>
        {t('queue.claimPromptMessage')}
      </Text>

      <View style={styles.timerContainer}>
        <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
          {timeDisplay}
        </Text>
        <Text style={styles.timerLabel}>{t('queue.timeRemaining')}</Text>
      </View>

      <Button
        title={t('queue.joinNow')}
        onPress={handleClaim}
        variant="primary"
        loading={claimSlot.isPending}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.base,
    paddingBlock: spacing.xl,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: neutral[500],
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingBlock: spacing.sm,
  },
  timer: {
    ...typography.textStyles.display,
    color: primary[600],
    fontSize: normalize(48),
  },
  timerUrgent: {
    color: semantic.error,
  },
  timerLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
  },
});
