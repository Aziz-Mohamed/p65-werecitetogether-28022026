import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useRatingStats } from '../hooks/useTeacherRatings';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface RatingStatsDisplayProps {
  teacherId: string;
  programId: string;
}

export function RatingStatsDisplay({ teacherId, programId }: RatingStatsDisplayProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useRatingStats(teacherId, programId);

  if (isLoading) {
    return null;
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <Text style={styles.newTeacher}>{t('ratings.newTeacher')}</Text>
      </Card>
    );
  }

  return (
    <Card variant="default" style={styles.card}>
      {/* Average Rating */}
      <View style={styles.averageRow}>
        <Text style={styles.averageValue}>
          {stats.average_rating.toFixed(1)}
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(stats.average_rating) ? 'star' : 'star-outline'}
              size={18}
              color={primary[500]}
            />
          ))}
        </View>
        <Text style={styles.reviewCount}>
          ({stats.total_reviews} {t('ratings.reviews')})
        </Text>
      </View>

      {/* Common Tags */}
      {stats.common_positive_tags && stats.common_positive_tags.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>{t('ratings.positiveTags')}</Text>
          <View style={styles.tagsRow}>
            {stats.common_positive_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} label={tag} variant="success" size="sm" />
            ))}
          </View>
        </View>
      )}

      {stats.common_constructive_tags && stats.common_constructive_tags.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.tagLabel}>{t('ratings.constructiveTags')}</Text>
          <View style={styles.tagsRow}>
            {stats.common_constructive_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} label={tag} variant="warning" size="sm" />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  newTeacher: {
    ...typography.textStyles.body,
    color: neutral[400],
    textAlign: 'center',
    paddingBlock: spacing.md,
  },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  averageValue: {
    ...typography.textStyles.display,
    color: lightTheme.text,
    fontSize: normalize(32),
  },
  starsRow: {
    flexDirection: 'row',
    gap: normalize(2),
  },
  reviewCount: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  tagSection: {
    gap: spacing.xs,
  },
  tagLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
