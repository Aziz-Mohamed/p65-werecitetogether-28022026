import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TrendDirection } from '../types/reports.types';
import { semantic, neutral } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { spacing } from '@/theme/spacing';

const TREND_CONFIG: Record<TrendDirection, { icon: string; color: string }> = {
  up: { icon: 'arrow-up', color: semantic.success },
  down: { icon: 'arrow-down', color: semantic.error },
  steady: { icon: 'remove', color: neutral[400] },
};

interface TrendArrowProps {
  direction: TrendDirection;
  label?: string;
  size?: number;
}

export function TrendArrow({ direction, label, size = normalize(14) }: TrendArrowProps) {
  const config = TREND_CONFIG[direction];

  return (
    <View style={styles.container}>
      <Ionicons name={config.icon as any} size={size} color={config.color} />
      {label && label !== '--' && (
        <Text style={[styles.label, { color: config.color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
