import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { QueueStatus } from './QueueStatus';
import { useJoinQueue } from '../hooks/useJoinQueue';
import { useQueuePosition } from '../hooks/useQueuePosition';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface JoinQueueButtonProps {
  programId: string;
}

export function JoinQueueButton({ programId }: JoinQueueButtonProps) {
  const { t } = useTranslation();
  const joinQueue = useJoinQueue();
  const { data: status } = useQueuePosition(programId);

  // Already in queue — show status instead
  if (status?.in_queue) {
    return <QueueStatus programId={programId} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.noTeachersText}>{t('queue.noTeachersAvailable')}</Text>
      <Button
        title={joinQueue.isPending ? t('queue.joining') : t('queue.joinQueue')}
        onPress={() => joinQueue.mutate(programId)}
        variant="primary"
        size="md"
        disabled={joinQueue.isPending}
        icon={<Ionicons name="notifications-outline" size={18} color={colors.white} />}
      />
      <Text style={styles.descText}>{t('queue.joinQueueDesc')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  noTeachersText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  descText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    textAlign: 'center',
  },
});
