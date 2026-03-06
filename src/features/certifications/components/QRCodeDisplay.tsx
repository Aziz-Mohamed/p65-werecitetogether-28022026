import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

interface QRCodeDisplayProps {
  certificateNumber: string;
  size?: number;
}

export function QRCodeDisplay({ certificateNumber, size = 120 }: QRCodeDisplayProps) {
  const verificationUrl = `${SUPABASE_URL}/functions/v1/verify-certificate?number=${encodeURIComponent(certificateNumber)}`;

  return (
    <View style={styles.container}>
      <QRCode value={verificationUrl} size={size} />
      <Text style={styles.number}>{certificateNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  number: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    fontFamily: 'monospace',
  },
});
