import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { typography } from '@/theme/typography';
import { primary, neutral, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface RatingBadgeProps {
  averageRating: number | null;
  totalReviews: number;
  /** Minimum reviews to show numeric rating; below this shows "New" */
  minReviews?: number;
}

export function RatingBadge({
  averageRating,
  totalReviews,
  minReviews = 5,
}: RatingBadgeProps) {
  if (!averageRating || totalReviews < minReviews) {
    return (
      <View style={styles.container}>
        <Ionicons name="star-outline" size={14} color={neutral[400]} />
        <Text style={styles.newText}>New</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="star" size={14} color={primary[500]} />
      <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
      <Text style={styles.countText}>({totalReviews})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  ratingText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
  },
  countText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  newText: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
});
