import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useHimamEvent } from '@/features/himam/hooks/useHimamEvents';
import {
  useHimamRegistration,
  useRegisterForEvent,
  useCancelRegistration,
} from '@/features/himam/hooks/useHimamRegistration';
import { useHimamProgress } from '@/features/himam/hooks/useHimamProgress';
import { HimamTrackPicker } from '@/features/himam/components/HimamTrackPicker';
import { PartnerCard } from '@/features/himam/components/PartnerCard';
import { JuzProgressGrid } from '@/features/himam/components/JuzProgressGrid';
import type { HimamTrack } from '@/features/himam/types/himam.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function StudentHimamEventScreen() {
  const { t, i18n } = useTranslation();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { profile } = useAuth();
  const isAr = i18n.language === 'ar';

  const [selectedTrack, setSelectedTrack] = useState<HimamTrack | null>(null);

  const { data: event, isLoading: eventLoading } = useHimamEvent(eventId);
  const { data: registration, isLoading: regLoading } = useHimamRegistration(eventId, profile?.id);
  const { data: progress = [] } = useHimamProgress(registration?.id);

  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelRegistration();

  const handleRegister = useCallback(() => {
    if (!eventId || !profile?.id || !selectedTrack) return;
    registerMutation.mutate({ eventId, studentId: profile.id, track: selectedTrack });
  }, [eventId, profile?.id, selectedTrack, registerMutation]);

  const handleCancel = useCallback(() => {
    if (!registration?.id) return;
    cancelMutation.mutate(registration.id);
  }, [registration?.id, cancelMutation]);

  if (eventLoading || regLoading) return <LoadingState />;
  if (!event) return null;

  const eventDate = new Date(event.event_date).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );

  const isRegistered = registration && registration.status !== 'cancelled';
  const partner = (registration as any)?.partner;

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Event Info */}
        <Card variant="default">
          <Text style={styles.eventTitle}>{t('himam.title')}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
          <View style={styles.eventMeta}>
            <Text style={styles.metaText}>{event.start_time} – {event.end_time}</Text>
            <Badge variant={event.status === 'active' ? 'success' : 'warning'} size="sm" label={t(`himam.status.${event.status}`)} />
          </View>
        </Card>

        {/* Registration / Track Selection */}
        {!isRegistered ? (
          <Card variant="default">
            <HimamTrackPicker selectedTrack={selectedTrack} onSelectTrack={setSelectedTrack} />
            <Button
              variant="primary"
              onPress={handleRegister}
              loading={registerMutation.isPending}
              disabled={!selectedTrack}
              style={styles.registerButton}
              title={t('himam.register')}
            />
          </Card>
        ) : (
          <>
            {/* Partner Info */}
            <Text style={styles.sectionTitle}>{t('himam.partner.title')}</Text>
            {partner ? (
              <PartnerCard
                partnerName={partner.display_name ?? partner.full_name}
                meetingLink={partner.meeting_link}
                status={registration.status}
              />
            ) : (
              <Card variant="outlined">
                <Text style={styles.noPartner}>{t('himam.partner.noPartner')}</Text>
              </Card>
            )}

            {/* Juz' Progress */}
            {progress.length > 0 ? (
              <Card variant="default">
                <JuzProgressGrid progress={progress} />
              </Card>
            ) : null}

            {/* Cancel */}
            {registration.status === 'registered' || registration.status === 'paired' ? (
              <Button
                variant="danger"
                onPress={handleCancel}
                loading={cancelMutation.isPending}
                title={t('himam.cancelRegistration')}
              />
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.base, paddingVertical: spacing.base },
  eventTitle: { ...typography.textStyles.heading, color: lightTheme.text },
  eventDate: { ...typography.textStyles.body, color: lightTheme.textSecondary, marginTop: spacing.xs },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  metaText: { ...typography.textStyles.caption, color: neutral[500] },
  sectionTitle: { ...typography.textStyles.subheading, color: lightTheme.text },
  noPartner: { ...typography.textStyles.body, color: neutral[400], textAlign: 'center', paddingVertical: spacing.lg },
  registerButton: { marginTop: spacing.md },
});
