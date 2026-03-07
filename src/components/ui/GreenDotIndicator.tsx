import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { normalize } from '@/theme/normalize';
import { colors } from '@/theme/colors';

interface GreenDotIndicatorProps {
  isAvailable: boolean;
  /** When true, positions absolutely over a parent (e.g. avatar). @default false */
  overlay?: boolean;
}

const DOT_SIZE = normalize(8);
const GREEN = colors.primary[500];

export function GreenDotIndicator({ isAvailable, overlay = false }: GreenDotIndicatorProps) {
  if (!isAvailable) return null;

  return (
    <View
      style={[styles.container, overlay && styles.overlay]}
      accessibilityLabel="Available"
    >
      <View style={styles.dot} />
      <Text style={styles.label}>Available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(2),
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    end: 0,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: GREEN,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  label: {
    fontSize: normalize(8),
    color: GREEN,
    fontWeight: '600',
  },
});
