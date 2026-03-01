import React from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui';
import type { PeerPairingWithPartners } from '../types/peer-pairing.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface PeerPairingCardProps {
  pairing: PeerPairingWithPartners;
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onLogSession?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function PeerPairingCard({
  pairing,
  currentUserId,
  onAccept,
  onDecline,
  onLogSession,
  onComplete,
  onCancel,
  loading,
}: PeerPairingCardProps) {
  const { t } = useTranslation();

  const isStudentA = pairing.student_a_id === currentUserId;
  const partner = isStudentA ? pairing.student_b : pairing.student_a;
  const partnerName = partner?.display_name ?? partner?.full_name ?? '—';
  const meetingLink = partner?.meeting_link;
  const isPending = pairing.status === 'pending';
  const isActive = pairing.status === 'active';
  const isRecipient = !isStudentA && isPending;

  return (
    <Card variant="default" style={styles.card}>
      <View style={styles.header}>
        <Avatar name={partnerName} size="sm" />
        <View style={styles.info}>
          <Text style={styles.name}>{partnerName}</Text>
          <Text style={styles.section}>
            {t(`peerPairing.sectionType.${pairing.section_type}`)}
          </Text>
        </View>
        <Badge
          variant={isActive ? 'success' : isPending ? 'warning' : 'default'}
          size="sm"
          label={t(`peerPairing.status.${pairing.status}`)}
        />
      </View>

      {isActive && (
        <Text style={styles.sessions}>
          {t('peerPairing.sessionCount', { count: pairing.session_count ?? 0 })}
        </Text>
      )}

      {meetingLink && isActive && (
        <Button
          variant="secondary"
          size="sm"
          onPress={() => Linking.openURL(meetingLink)}
          title={t('peerPairing.joinMeeting')}
        />
      )}

      <View style={styles.actions}>
        {isRecipient && (
          <>
            <Button variant="primary" size="sm" onPress={onAccept!} loading={loading} style={styles.btn} title={t('common.accept')} />
            <Button variant="danger" size="sm" onPress={onDecline!} loading={loading} style={styles.btn} title={t('common.decline')} />
          </>
        )}

        {isActive && onLogSession && (
          <Button variant="primary" size="sm" onPress={onLogSession} loading={loading} style={styles.btn} title={t('peerPairing.logSession')} />
        )}

        {isActive && onComplete && (
          <Button variant="secondary" size="sm" onPress={onComplete} loading={loading} style={styles.btn} title={t('peerPairing.markComplete')} />
        )}

        {(isPending && isStudentA || isActive) && onCancel && (
          <Button variant="ghost" size="sm" onPress={onCancel} loading={loading} style={styles.btn} title={t('common.cancel')} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  info: { flex: 1 },
  name: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  section: { ...typography.textStyles.caption, color: neutral[500] },
  sessions: { ...typography.textStyles.caption, color: neutral[500] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  btn: { flex: 1 },
});
