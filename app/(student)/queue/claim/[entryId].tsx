import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { LoadingState } from '@/components/feedback';
import { Button } from '@/components/ui/Button';
import { queueService } from '@/features/queue/services/queue.service';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function QueueClaimScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<'claiming' | 'success' | 'expired' | 'error'>('claiming');
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;

    (async () => {
      try {
        const result = await queueService.claimQueueSlot(entryId);
        if (result.success && result.meeting_link) {
          setStatus('success');
          setMeetingLink(result.meeting_link);
          // Auto-open meeting link
          try {
            await Linking.openURL(result.meeting_link);
          } catch {
            // Link will be shown for manual copy
          }
        } else {
          setStatus('expired');
        }
      } catch {
        setStatus('expired');
      }
    })();
  }, [entryId]);

  if (status === 'claiming') {
    return (
      <Screen>
        <View style={styles.container}>
          <LoadingState />
          <Text style={styles.claimingText}>{t('queue.claimSlot')}</Text>
        </View>
      </Screen>
    );
  }

  if (status === 'expired') {
    return (
      <Screen>
        <View style={styles.container}>
          <Ionicons name="time-outline" size={normalize(48)} color={colors.neutral[400]} />
          <Text style={styles.expiredText}>{t('queue.claimExpired')}</Text>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Ionicons name="checkmark-circle" size={normalize(48)} color={colors.primary[500]} />
        <Text style={styles.successText}>{t('queue.claimSuccess')}</Text>
        {meetingLink && (
          <Button
            title={t('availability.joinSession')}
            onPress={() => Linking.openURL(meetingLink)}
            variant="primary"
          />
        )}
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  claimingText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  expiredText: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  successText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    textAlign: 'center',
  },
});
