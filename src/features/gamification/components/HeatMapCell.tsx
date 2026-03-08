import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { FreshnessState } from '../types/gamification.types';
import { getHeatMapColor } from '../utils/heatmap-colors';
import { colors, neutral } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface HeatMapCellProps {
  rubNumber: number;
  /** Pass null for uncertified rub' */
  freshnessState: FreshnessState | null;
  size: number;
  onPress?: () => void;
}

// States where white text is readable against the background
const DARK_BG_STATES = new Set<FreshnessState>(['fresh', 'warning', 'critical']);

export const HeatMapCell = memo(function HeatMapCell({
  rubNumber,
  freshnessState,
  size,
  onPress,
}: HeatMapCellProps) {
  const bgColor = getHeatMapColor(freshnessState);
  const isCertified = freshnessState !== null && freshnessState !== 'uncertified';

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const cellStyle = [
    styles.cell,
    {
      width: size,
      height: size,
      backgroundColor: bgColor,
      borderColor: isCertified ? bgColor : neutral[300],
      borderStyle: isCertified ? ('solid' as const) : ('dashed' as const),
    },
  ];

  const textColor = isCertified && DARK_BG_STATES.has(freshnessState!) ? colors.white : neutral[500];
  const fontSize = size > 30 ? normalize(10) : normalize(8);

  const stateLabel = freshnessState ?? 'uncertified';

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Rub' ${rubNumber}, ${stateLabel}`}
      >
        <View style={cellStyle}>
          <Text style={[styles.number, { color: textColor, fontSize }]}>
            {rubNumber}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={cellStyle} accessibilityLabel={`Rub' ${rubNumber}`}>
      <Text style={[styles.number, { color: textColor, fontSize }]}>
        {rubNumber}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  cell: {
    borderRadius: radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: typography.fontFamily.semiBold,
  },
});
