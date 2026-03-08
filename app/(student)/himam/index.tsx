import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { EventCard } from '@/features/himam/components/EventCard';
import { PartnerCard } from '@/features/himam/components/PartnerCard';
import { TrackSelector } from '@/features/himam/components/TrackSelector';
import { JuzPicker } from '@/features/himam/components/JuzPicker';
import { TimeSlotSelector } from '@/features/himam/components/TimeSlotSelector';
import { useUpcomingEvent } from '@/features/himam/hooks/useUpcomingEvent';
import { useMyRegistration } from '@/features/himam/hooks/useMyRegistration';
import { useRegisterForEvent } from '@/features/himam/hooks/useRegisterForEvent';
import { useCancelRegistration } from '@/features/himam/hooks/useCancelRegistration';
import {
  ALL_TRACKS,
  ALL_PRAYER_SLOTS,
  TRACK_JUZ_COUNT,
  type HimamTrack,
  type PrayerTimeSlot,
} from '@/features/himam/types/himam.types';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

const registrationSchema = z.object({
  track: z.enum(ALL_TRACKS as unknown as [string, ...string[]]) as z.ZodType<HimamTrack>,
  selectedJuz: z.array(z.number().min(1).max(30)),
  timeSlots: z.array(z.enum(ALL_PRAYER_SLOTS as unknown as [string, ...string[]])).min(1) as z.ZodType<PrayerTimeSlot[]>,
}).refine(
  (data) => data.selectedJuz.length === TRACK_JUZ_COUNT[data.track],
  { path: ['selectedJuz'], message: 'HIMAM_INVALID_JUZ_COUNT' },
);

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function HimamScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data: event, isLoading: eventLoading, error: eventError, refetch } = useUpcomingEvent(programId);
  const { data: registration, isLoading: regLoading } = useMyRegistration(event?.id, userId);
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelRegistration();

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { track: '3_juz' as HimamTrack, selectedJuz: [], timeSlots: [] },
  });

  const track = watch('track');
  const selectedJuz = watch('selectedJuz');

  // Reset juz selection when track changes
  useEffect(() => {
    if (track === '30_juz') {
      setValue('selectedJuz', Array.from({ length: 30 }, (_, i) => i + 1));
    } else {
      setValue('selectedJuz', []);
    }
  }, [track, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (!event) return;
    registerMutation.mutate(
      {
        eventId: event.id,
        track: data.track,
        selectedJuz: data.selectedJuz,
        timeSlots: data.timeSlots,
      },
      {
        onSuccess: (result) => {
          if (result.error) {
            const errCode = (result.error as { code?: string })?.code;
            const key = errCode && errCode.startsWith('HIMAM_')
              ? `himam.errors.${errCode}`
              : 'himam.errors.unknown';
            Alert.alert(t('common.error'), t(key));
            return;
          }
          Alert.alert(t('common.success'), t('himam.registrationSuccess'));
          reset();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('himam.errors.unknown'));
        },
      },
    );
  });

  const handleCancel = useCallback(() => {
    if (!registration) return;
    Alert.alert(
      t('himam.cancelRegistration'),
      t('himam.cancelRegistrationConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate(registration.id, {
              onSuccess: () => {
                Alert.alert(t('common.success'), t('himam.registrationCancelled'));
              },
              onError: () => {
                Alert.alert(t('common.error'), t('himam.errors.unknown'));
              },
            });
          },
        },
      ],
    );
  }, [registration, cancelMutation, t]);

  if (eventError) return <ErrorState description={eventError.message} onRetry={refetch} />;

  const isLoading = eventLoading || regLoading;
  const isRegistered = !!registration && registration.status !== 'cancelled';
  const deadlinePassed = event ? new Date(event.registration_deadline) < new Date() : false;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={normalize(24)} color={lightTheme.text} />
        </Pressable>
        <Text style={styles.title}>{t('himam.title')}</Text>
        <Text style={styles.subtitle}>{t('himam.subtitle')}</Text>

        {isLoading ? (
          <View style={styles.loadingPlaceholder} />
        ) : !event ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('himam.noUpcomingEvent')}</Text>
          </View>
        ) : (
          <>
            <EventCard event={event} />

            {isRegistered ? (
              <View style={styles.registeredSection}>
                <View style={styles.registeredBadge}>
                  <Text style={styles.registeredText}>
                    {t(`himam.status.${registration.status}`)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('himam.tracks.label')}:</Text>
                  <Text style={styles.detailValue}>{t(`himam.tracks.${registration.track}`)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('himam.juzPicker.label')}:</Text>
                  <Text style={styles.detailValue}>
                    {registration.selected_juz?.join(', ')}
                  </Text>
                </View>

                {registration.partner ? (
                  <PartnerCard
                    partner={registration.partner}
                    myMeetingLink={registration.student?.meeting_link}
                    timeSlots={registration.time_slots as PrayerTimeSlot[] | undefined}
                  />
                ) : registration.status === 'registered' && (
                  <Text style={styles.awaitingPartner}>{t('himam.partner.noPartner')}</Text>
                )}

                {registration.status === 'registered' && !deadlinePassed && (
                  <Button
                    title={t('himam.cancelRegistration')}
                    onPress={handleCancel}
                    variant="danger"
                    loading={cancelMutation.isPending}
                    fullWidth
                  />
                )}

                {(registration.status === 'paired' || registration.status === 'in_progress') && (
                  <Button
                    title={t('himam.progress.title')}
                    onPress={() => router.push(`/(student)/himam/${event.id}/progress`)}
                    fullWidth
                  />
                )}
              </View>
            ) : !deadlinePassed ? (
              <View style={styles.formSection}>
                <Controller
                  control={control}
                  name="track"
                  render={({ field: { value, onChange } }) => (
                    <TrackSelector value={value} onChange={onChange} />
                  )}
                />

                <Controller
                  control={control}
                  name="selectedJuz"
                  render={({ field: { value, onChange } }) => (
                    <JuzPicker value={value} onChange={onChange} track={track} />
                  )}
                />
                {errors.selectedJuz && (
                  <Text style={styles.errorText}>
                    {t(`himam.errors.${errors.selectedJuz.message ?? 'HIMAM_INVALID_JUZ_COUNT'}`)}
                  </Text>
                )}

                <Controller
                  control={control}
                  name="timeSlots"
                  render={({ field: { value, onChange } }) => (
                    <TimeSlotSelector value={value} onChange={onChange} />
                  )}
                />

                <Button
                  title={t('himam.registerButton')}
                  onPress={onSubmit}
                  loading={registerMutation.isPending}
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('himam.errors.HIMAM_REGISTRATION_CLOSED')}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
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
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBottom: spacing.sm,
  },
  loadingPlaceholder: {
    height: 200,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 12,
  },
  emptyContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  formSection: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
    marginTop: -spacing.sm,
  },
  registeredSection: {
    gap: spacing.md,
    backgroundColor: lightTheme.card,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  registeredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  registeredText: {
    ...typography.textStyles.caption,
    color: lightTheme.success,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  detailValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '500',
  },
  awaitingPartner: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
