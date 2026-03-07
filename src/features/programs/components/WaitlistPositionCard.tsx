import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { useMyWaitlistEntry, useCancelWaitlist } from '../hooks/useWaitlist';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface WaitlistPositionCardProps {
  cohortId: string;
  userId: string | undefined;
  enrollmentId: string;
  onLeave: () => void;
  leavePending?: boolean;
}

export function WaitlistPositionCard({
  cohortId,
  userId,
  enrollmentId,
  onLeave,
  leavePending,
}: WaitlistPositionCardProps) {
  const { t } = useTranslation();
  const { data: entry } = useMyWaitlistEntry(cohortId, userId);
  const cancelWaitlist = useCancelWaitlist();

  const handleCancel = () => {
    if (entry) {
      cancelWaitlist.mutate(entry.id, { onSuccess: onLeave });
    } else {
      onLeave();
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={normalize(20)} color={colors.accent.orange[500]} />
        <View style={styles.textContainer}>
          <Text style={styles.status}>{t('programs.status.waitlisted')}</Text>
          {entry && (
            <Text style={styles.position}>
              {t('programs.labels.waitlistPosition', { position: entry.position })}
            </Text>
          )}
        </View>
      </View>
      <Button
        title={t('programs.actions.cancelWaitlist')}
        onPress={handleCancel}
        variant="danger"
        size="sm"
        loading={cancelWaitlist.isPending || leavePending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  status: {
    ...typography.textStyles.bodyMedium,
    color: colors.accent.orange[500],
  },
  position: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
