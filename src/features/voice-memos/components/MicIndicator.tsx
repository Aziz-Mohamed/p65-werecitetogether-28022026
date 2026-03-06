import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { normalize } from '@/theme/normalize';

interface MicIndicatorProps {
  hasVoiceMemo: boolean;
}

export function MicIndicator({ hasVoiceMemo }: MicIndicatorProps) {
  if (!hasVoiceMemo) return null;

  return (
    <View style={styles.container} accessibilityLabel="Has voice memo">
      <Ionicons name="mic" size={14} color={colors.primary[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
