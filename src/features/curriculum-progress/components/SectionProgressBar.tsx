import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface SectionProgressBarProps {
  percentage: number;
  completedSections: number;
  totalSections: number;
}

export function SectionProgressBar({ percentage, completedSections, totalSections }: SectionProgressBarProps) {
  const fillColor = percentage >= 100 ? '#22c55e' : percentage >= 50 ? primary[500] : '#f59e0b';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.percentage}>{percentage}%</Text>
        <Text style={styles.fraction}>
          {completedSections}/{totalSections}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percentage: { ...typography.textStyles.bodyMedium, color: lightTheme.text },
  fraction: { ...typography.textStyles.caption, color: neutral[500] },
  track: {
    height: 8,
    backgroundColor: neutral[100],
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
