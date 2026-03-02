import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useQueueSize,
  useJoinQueue,
  useLeaveQueue,
  useQueuePosition,
  useDailySessionCount,
} from '../hooks/useQueue';
import { useActiveDraftSession } from '@/features/sessions/hooks/useActiveDraftSession';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface NoTeachersAvailableProps {
  studentId: string;
  programId: string;
}

export function NoTeachersAvailable({
  studentId,
  programId,
}: NoTeachersAvailableProps) {
  const { t } = useTranslation();
  const { data: queueSize = 0 } = useQueueSize(programId);
  const { data: existingEntry } = useQueuePosition(studentId, programId);
  const { data: todayCount = 0 } = useDailySessionCount(studentId, programId);
  const { data: activeDraft } = useActiveDraftSession(studentId);
  const joinQueue = useJoinQueue();
  const leaveQueue = useLeaveQueue();

  const alreadyInQueue = !!existingEntry;
  const hasActiveDraft = !!activeDraft;

  const handleJoinQueue = () => {
    joinQueue.mutate({ studentId, programId });
  };

  const handleLeaveQueue = () => {
    if (existingEntry) {
      leaveQueue.mutate({
        queueEntryId: existingEntry.id,
        studentId,
        programId,
      });
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <Ionicons
        name="people-outline"
        size={normalize(40)}
        color={neutral[300]}
      />
      <Text style={styles.title}>{t('queue.noTeachersAvailable')}</Text>
      <Text style={styles.subtitle}>
        {t('queue.allTeachersBusy')}
      </Text>

      {queueSize > 0 && (
        <View style={styles.queueInfo}>
          <Ionicons name="people" size={16} color={primary[500]} />
          <Text style={styles.queueInfoText}>
            {t('queue.studentsWaiting', { count: queueSize })}
          </Text>
        </View>
      )}

      {alreadyInQueue && existingEntry && (
        <View style={styles.queueInfo}>
          <Ionicons name="time-outline" size={16} color={primary[500]} />
          <Text style={styles.positionText}>
            {t('queue.position', { position: existingEntry.position })}
          </Text>
        </View>
      )}

      {todayCount > 0 && (
        <View style={styles.queueInfo}>
          <Ionicons name="today-outline" size={16} color={neutral[400]} />
          <Text style={styles.queueInfoText}>
            {t('queue.todaySessions', { count: todayCount })}
          </Text>
        </View>
      )}

      {alreadyInQueue ? (
        <Button
          title={t('queue.leaveQueue')}
          onPress={handleLeaveQueue}
          variant="ghost"
          size="sm"
          loading={leaveQueue.isPending}
          fullWidth
          style={styles.button}
        />
      ) : (
        !hasActiveDraft && (
          <Button
            title={t('queue.notifyMe')}
            onPress={handleJoinQueue}
            variant="primary"
            size="sm"
            loading={joinQueue.isPending}
            fullWidth
            style={styles.button}
          />
        )
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBlock: spacing.xl,
    borderStyle: 'dashed',
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: neutral[500],
    textAlign: 'center',
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  queueInfoText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  positionText: {
    ...typography.textStyles.caption,
    color: primary[600],
    fontWeight: '600',
  },
  button: {
    marginBlockStart: spacing.sm,
  },
});
