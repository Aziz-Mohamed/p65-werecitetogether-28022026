import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { PartnerCard } from '@/features/himam/components/PartnerCard';
import { ProgressTracker } from '@/features/himam/components/ProgressTracker';
import { useMyRegistration } from '@/features/himam/hooks/useMyRegistration';
import { useHimamProgress } from '@/features/himam/hooks/useHimamProgress';
import { useMarkJuzComplete } from '@/features/himam/hooks/useMarkJuzComplete';
import type { PrayerTimeSlot } from '@/features/himam/types/himam.types';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export default function HimamProgressScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    data: registration,
    isLoading: regLoading,
    error: regError,
    refetch,
  } = useMyRegistration(eventId, userId);

  const {
    data: progress,
    isLoading: progressLoading,
  } = useHimamProgress(registration?.id);

  const markComplete = useMarkJuzComplete();

  const handleMarkComplete = useCallback(
    (juzNumber: number) => {
      if (!registration) return;
      markComplete.mutate(
        { registrationId: registration.id, juzNumber },
        {
          onError: (error) => {
            const errCode = (error as { code?: string })?.code;
            const key = errCode && errCode.startsWith('HIMAM_')
              ? `himam.errors.${errCode}`
              : 'himam.errors.unknown';
            Alert.alert(t('common.error'), t(key));
          },
        },
      );
    },
    [registration, markComplete, t],
  );

  if (regError) return <ErrorState description={regError.message} onRetry={refetch} />;

  const isLoading = regLoading || progressLoading;
  const isEventActive = registration?.status === 'in_progress';

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('himam.progress.title')}</Text>

        {isLoading ? (
          <View style={styles.loadingPlaceholder} />
        ) : !registration ? (
          <Text style={styles.emptyText}>{t('himam.errors.HIMAM_REG_NOT_FOUND')}</Text>
        ) : (
          <>
            {registration.partner && (
              <PartnerCard
                partner={registration.partner}
                myMeetingLink={registration.student?.meeting_link}
                timeSlots={registration.time_slots as PrayerTimeSlot[] | undefined}
              />
            )}

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t('himam.tracks.label')}:</Text>
              <Text style={styles.statusValue}>
                {t(`himam.tracks.${registration.track}`)}
              </Text>
            </View>

            {progress && (
              <ProgressTracker
                progress={progress}
                onMarkComplete={handleMarkComplete}
                isEventActive={isEventActive}
                isPending={markComplete.isPending}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  loadingPlaceholder: {
    height: 200,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 12,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  statusValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '600',
  },
});
