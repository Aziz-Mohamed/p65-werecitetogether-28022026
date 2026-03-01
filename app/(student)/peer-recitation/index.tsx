import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useActivePairings, useRequestPairing, useRespondToPairing, useCancelPairing, useCompletePairing } from '@/features/peer-pairing/hooks/usePeerPairing';
import { useAvailablePartners, useTogglePeerAvailability } from '@/features/peer-pairing/hooks/usePeerAvailability';
import { useLogPeerSession } from '@/features/peer-pairing/hooks/usePeerSessions';
import { AvailablePeerList } from '@/features/peer-pairing/components/AvailablePeerList';
import { PeerPairingCard } from '@/features/peer-pairing/components/PeerPairingCard';
import type { SectionType } from '@/features/peer-pairing/types/peer-pairing.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function StudentPeerRecitationScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [sectionType] = useState<SectionType>('quran');

  // TODO: Get programId from context/store
  const programId = undefined as string | undefined;

  const isAvailable = (profile as any)?.peer_available ?? false;

  const { data: pairings = [], isLoading } = useActivePairings(profile?.id, programId);
  const { data: availablePeers = [] } = useAvailablePartners(programId, sectionType, profile?.id);
  const toggleAvailability = useTogglePeerAvailability();
  const requestPairing = useRequestPairing();
  const respondPairing = useRespondToPairing();
  const logSession = useLogPeerSession();
  const completePairing = useCompletePairing();
  const cancelPairing = useCancelPairing();

  const handleToggleAvailability = useCallback(
    (value: boolean) => {
      if (!profile?.id) return;
      toggleAvailability.mutate({ studentId: profile.id, available: value });
    },
    [profile?.id, toggleAvailability],
  );

  const handleRequestPairing = useCallback(
    (peerId: string) => {
      if (!profile?.id || !programId) return;
      requestPairing.mutate({
        program_id: programId,
        section_type: sectionType,
        student_a_id: profile.id,
        student_b_id: peerId,
      });
    },
    [profile?.id, programId, sectionType, requestPairing],
  );

  if (isLoading && programId) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('peerPairing.title')}</Text>

        {/* Availability Toggle (FR-039) */}
        <Card variant="default" style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>{t('peerPairing.availability')}</Text>
              <Text style={styles.toggleHint}>{t('peerPairing.availabilityHint')}</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
            />
          </View>
        </Card>

        {/* Active Pairings */}
        {pairings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('peerPairing.activePairings')}</Text>
            {pairings.map((pairing: any) => (
              <PeerPairingCard
                key={pairing.id}
                pairing={pairing}
                currentUserId={profile?.id ?? ''}
                onAccept={() => respondPairing.mutate({ pairingId: pairing.id, action: 'accept' })}
                onDecline={() => respondPairing.mutate({ pairingId: pairing.id, action: 'decline' })}
                onLogSession={() => logSession.mutate(pairing.id)}
                onComplete={() => completePairing.mutate(pairing.id)}
                onCancel={() => cancelPairing.mutate(pairing.id)}
                loading={respondPairing.isPending || logSession.isPending || completePairing.isPending || cancelPairing.isPending}
              />
            ))}
          </>
        )}

        {/* Available Peers */}
        <Text style={styles.sectionTitle}>{t('peerPairing.availablePeers')}</Text>
        {!programId ? (
          <EmptyState icon="people-outline" title={t('peerPairing.noProgram')} />
        ) : (
          <AvailablePeerList
            peers={availablePeers}
            onRequestPairing={handleRequestPairing}
            requestLoading={requestPairing.isPending}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.base, paddingVertical: spacing.base },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
  sectionTitle: { ...typography.textStyles.subheading, color: lightTheme.text },
  toggleCard: { padding: spacing.md },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  toggleHint: { ...typography.textStyles.caption, color: neutral[500], marginTop: spacing.xs },
});
