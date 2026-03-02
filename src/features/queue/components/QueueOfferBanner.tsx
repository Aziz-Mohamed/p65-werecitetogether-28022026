import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface QueueOfferBannerProps {
  teacherName: string;
  platform: string;
  expiresAt: string;
  onClaim: () => void;
  onDismiss: () => void;
}

export function QueueOfferBanner({
  teacherName,
  platform,
  expiresAt,
  onClaim,
  onDismiss,
}: QueueOfferBannerProps) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const remaining = Math.max(0, Math.floor(diff / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onDismiss]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="notifications" size={20} color={primary[600]} />
          <Text style={styles.title}>{t('queue.teacherAvailable')}</Text>
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={neutral[400]} />
          </Pressable>
        </View>

        <Text style={styles.teacherName}>{teacherName}</Text>
        {platform ? (
          <Text style={styles.platformText}>
            {platform.replaceAll('_', ' ')}
          </Text>
        ) : null}

        <View style={styles.timerRow}>
          <Ionicons
            name="timer-outline"
            size={16}
            color={isUrgent ? lightTheme.error : neutral[500]}
          />
          <Text
            style={[
              styles.timerText,
              isUrgent && styles.timerUrgent,
            ]}
            accessibilityLabel={t('sessionJoin.secondsRemaining', {
              seconds: secondsLeft,
            })}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>

        <Button
          title={t('sessionJoin.claimAndJoin')}
          onPress={onClaim}
          variant="primary"
          size="sm"
          fullWidth
          style={styles.claimButton}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 100,
    paddingInline: spacing.base,
    paddingBlockStart: spacing.base,
  },
  content: {
    backgroundColor: lightTheme.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  platformText: {
    ...typography.textStyles.caption,
    color: neutral[400],
    textTransform: 'capitalize',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timerText: {
    ...typography.textStyles.bodyMedium,
    color: neutral[500],
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: lightTheme.error,
  },
  claimButton: {
    marginBlockStart: spacing.xs,
    minHeight: 44,
  },
});
