import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface AvailablePeer {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AvailablePeerListProps {
  peers: AvailablePeer[];
  onRequestPairing: (peerId: string) => void;
  requestLoading?: boolean;
}

export function AvailablePeerList({ peers, onRequestPairing, requestLoading }: AvailablePeerListProps) {
  const { t } = useTranslation();

  if (peers.length === 0) {
    return (
      <Text style={styles.empty}>{t('peerPairing.noAvailablePeers')}</Text>
    );
  }

  return (
    <View style={styles.container}>
      {peers.map((peer) => (
        <Card key={peer.id} variant="default" style={styles.card}>
          <View style={styles.row}>
            <Avatar name={peer.display_name ?? peer.full_name} size="sm" />
            <Text style={styles.name} numberOfLines={1}>
              {peer.display_name ?? peer.full_name}
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={() => onRequestPairing(peer.id)}
              loading={requestLoading}
              title={t('peerPairing.request')}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.textStyles.bodyMedium, color: lightTheme.text, flex: 1 },
  empty: { ...typography.textStyles.body, color: neutral[400], textAlign: 'center', paddingVertical: spacing.lg },
});
