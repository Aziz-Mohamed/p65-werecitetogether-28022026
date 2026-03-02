import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

import { typography } from '@/theme/typography';
import { semantic, semanticSurface } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export function OfflineIndicator() {
  const netInfo = useNetInfo();

  if (netInfo.isConnected !== false) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={semantic.error} />
      <Text style={styles.text}>You're offline — some features unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: semanticSurface.error,
    minHeight: normalize(36),
  },
  text: {
    ...typography.textStyles.caption,
    color: semantic.error,
  },
});
