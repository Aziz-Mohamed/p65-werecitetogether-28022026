import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface PeerSessionLoggerProps {
  sessionCount: number;
  onLogSession: () => void;
  loading?: boolean;
}

export function PeerSessionLogger({ sessionCount, onLogSession, loading }: PeerSessionLoggerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <Ionicons name="book-outline" size={20} color={neutral[500]} />
        <Text style={styles.count}>
          {t('peerPairing.sessionCount', { count: sessionCount })}
        </Text>
      </View>
      <Button
        variant="primary"
        onPress={onLogSession}
        loading={loading}
        title={t('peerPairing.logSession')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { ...typography.textStyles.body, color: lightTheme.text },
});
