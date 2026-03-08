import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { FreshnessState } from '../types/gamification.types';
import { colors, primary, secondary, accent, neutral } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

interface RubBlockProps {
  rubNumber: number;
  state: FreshnessState;
  onPress?: () => void;
}

const STATE_COLORS: Record<FreshnessState, { bg: string; border: string; text: string }> = {
  fresh: { bg: primary[100], border: primary[500], text: primary[800] },
  fading: { bg: accent.yellow[100], border: accent.yellow[500], text: accent.yellow[700] },
  warning: { bg: accent.orange[100], border: accent.orange[500], text: accent.orange[700] },
  critical: { bg: accent.red[100], border: accent.red[500], text: accent.red[700] },
  dormant: { bg: neutral[100], border: neutral[400], text: neutral[500] },
  uncertified: { bg: colors.white, border: neutral[200], text: neutral[300] },
};

export function RubBlock({ rubNumber, state, onPress }: RubBlockProps) {
  const colorSet = STATE_COLORS[state];
  const isDashed = state === 'uncertified';

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const blockStyle = [
    styles.block,
    {
      backgroundColor: colorSet.bg,
      borderColor: colorSet.border,
      borderStyle: isDashed ? ('dashed' as const) : ('solid' as const),
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Rubʿ ${rubNumber}`}
      >
        <View style={blockStyle}>
          <Text style={[styles.number, { color: colorSet.text }]}>{rubNumber}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={blockStyle} accessibilityLabel={`Rubʿ ${rubNumber}`}>
      <Text style={[styles.number, { color: colorSet.text }]}>{rubNumber}</Text>
    </View>
  );
}

const BLOCK_SIZE = normalize(38);

const styles = StyleSheet.create({
  block: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  number: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(12),
  },
});
