import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { spacing } from '@/theme/spacing';

interface TeacherRatingBadgeProps {
  averageRating: number | null;
  totalReviews: number;
}

export function TeacherRatingBadge({ averageRating, totalReviews }: TeacherRatingBadgeProps) {
  const { t } = useTranslation();

  if (totalReviews < 5) {
    return (
      <View style={styles.container}>
        <Text style={styles.newLabel}>{t('ratings.newTeacher')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="star" size={normalize(14)} color={colors.accent.amber[400]} />
      <Text style={styles.rating}>{(averageRating ?? 0).toFixed(1)}</Text>
      <Text style={styles.count}>({totalReviews})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  rating: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.neutral[700],
  },
  count: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
  },
  newLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    fontFamily: typography.fontFamily.medium,
    paddingHorizontal: spacing.xs,
    paddingVertical: normalize(2),
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(8),
    overflow: 'hidden',
  },
});
