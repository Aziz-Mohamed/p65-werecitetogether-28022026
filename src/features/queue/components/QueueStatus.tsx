import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQueuePosition } from '../hooks/useQueuePosition';
import { useLeaveQueue } from '../hooks/useLeaveQueue';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface QueueStatusProps {
  programId: string;
}

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('0:00');
        return;
      }
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1_000);
      setRemaining(hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`);
    };

    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

export function QueueStatus({ programId }: QueueStatusProps) {
  const { t } = useTranslation();
  const { data: status } = useQueuePosition(programId);
  const leaveQueue = useLeaveQueue();

  const countdown = useCountdown(status?.expires_at ?? null);

  const handleLeave = () => {
    Alert.alert(
      t('queue.leaveConfirm'),
      t('queue.leaveConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('queue.leaveQueue'),
          style: 'destructive',
          onPress: () => leaveQueue.mutate(programId),
        },
      ],
    );
  };

  if (!status || !status.in_queue) return null;

  return (
    <Card variant="outlined" style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={normalize(20)} color={colors.primary[500]} />
        <Text style={styles.positionText}>
          {t('queue.position', { position: status.position })}
        </Text>
      </View>

      {status.estimated_wait_minutes != null && (
        <Text style={styles.waitText}>
          {t('queue.estimatedWait', { minutes: status.estimated_wait_minutes })}
        </Text>
      )}

      {countdown && (
        <Text style={styles.expiryText}>
          {t('queue.expiresIn', { time: countdown })}
        </Text>
      )}

      <Button
        title={t('queue.leaveQueue')}
        onPress={handleLeave}
        variant="outline"
        size="sm"
        loading={leaveQueue.isPending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.primary[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  positionText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  waitText: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  expiryText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
});
