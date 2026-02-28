import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQueuePosition, useLeaveQueue } from '../hooks/useQueue';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface QueueStatusProps {
  studentId: string;
  programId: string;
}

export function QueueStatus({ studentId, programId }: QueueStatusProps) {
  const { t } = useTranslation();
  const { data: queueEntry, isLoading } = useQueuePosition(studentId, programId);
  const leaveQueue = useLeaveQueue();

  if (isLoading || !queueEntry) return null;

  const handleLeave = () => {
    leaveQueue.mutate({
      queueEntryId: queueEntry.id,
      studentId,
      programId,
    });
  };

  return (
    <Card variant="primary-glow" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionNumber}>#{queueEntry.position}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {t('queue.inLine', { position: queueEntry.position })}
          </Text>
          <Text style={styles.subtitle}>
            {t('queue.waitingForTeacher')}
          </Text>
        </View>
      </View>

      <View style={styles.indicatorRow}>
        <Ionicons name="time-outline" size={16} color={neutral[400]} />
        <Text style={styles.estimateText}>
          {t('queue.estimatedWait')}
        </Text>
      </View>

      <Button
        title={t('queue.leaveQueue')}
        onPress={handleLeave}
        variant="ghost"
        size="sm"
        loading={leaveQueue.isPending}
        fullWidth
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  positionBadge: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionNumber: {
    ...typography.textStyles.subheading,
    color: primary[700],
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  estimateText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
});
