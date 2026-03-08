import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SkeletonLoader } from '@/components/feedback';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon, iconColor, isLoading }: StatCardProps) {
  const color = iconColor ?? colors.primary[500];

  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: color + '30', backgroundColor: color + '08' }]}>
        <SkeletonLoader width={normalize(40)} height={normalize(40)} borderRadius={normalize(20)} />
        <View style={styles.textContainer}>
          <SkeletonLoader width={normalize(60)} height={normalize(24)} />
          <SkeletonLoader width={normalize(80)} height={normalize(14)} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: color + '30', backgroundColor: color + '08' }]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={normalize(20)} color={color} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.value} numberOfLines={1} allowFontScaling={false}>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minWidth: normalize(140),
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  iconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  value: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(20),
  },
  label: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
