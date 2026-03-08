import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import type { RatingStats, TrendDirection } from '../types/ratings.types';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface RatingStatsCardProps {
  stats: RatingStats;
}

const TREND_CONFIG: Record<TrendDirection, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  improving: { icon: 'trending-up', color: colors.primary[500] },
  declining: { icon: 'trending-down', color: colors.accent.rose[500] },
  stable: { icon: 'remove-outline', color: colors.neutral[400] },
};

function StarDistributionBar({ star, count, maxCount }: { star: number; count: number; maxCount: number }) {
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{star}</Text>
      <Ionicons name="star" size={normalize(10)} color={colors.accent.amber[400]} />
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

export function RatingStatsCard({ stats }: RatingStatsCardProps) {
  const { t } = useTranslation();
  const trend = TREND_CONFIG[stats.trend_direction];

  const distribution = stats.star_distribution ?? {};
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <Card variant="default" style={styles.container}>
      <Text style={styles.title}>{t('ratings.averageRating')}</Text>

      {/* Average + Trend */}
      <View style={styles.avgRow}>
        <View style={styles.avgSection}>
          <Text style={styles.avgValue}>{stats.average_rating.toFixed(1)}</Text>
          <Ionicons name="star" size={normalize(20)} color={colors.accent.amber[400]} />
        </View>
        <View style={styles.trendBadge}>
          <Ionicons name={trend.icon} size={normalize(14)} color={trend.color} />
          <Text style={[styles.trendText, { color: trend.color }]}>
            {t(`ratings.trend.${stats.trend_direction}`)}
          </Text>
        </View>
      </View>

      <Text style={styles.reviewCount}>
        {t('ratings.reviews', { count: stats.total_reviews })}
      </Text>

      {/* Star Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionLabel}>{t('ratings.starDistribution')}</Text>
        {[5, 4, 3, 2, 1].map((star) => (
          <StarDistributionBar
            key={star}
            star={star}
            count={distribution[String(star)] ?? 0}
            maxCount={maxCount}
          />
        ))}
      </View>

      {/* Common Tags */}
      {stats.common_positive_tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.sectionLabel}>{t('ratings.commonPositive')}</Text>
          <View style={styles.tagsRow}>
            {stats.common_positive_tags.map((tag) => (
              <View key={tag} style={styles.tagChipPositive}>
                <Text style={styles.tagText}>{t(`ratings.tags.${tag}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {stats.common_constructive_tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.sectionLabel}>{t('ratings.commonConstructive')}</Text>
          <View style={styles.tagsRow}>
            {stats.common_constructive_tags.map((tag) => (
              <View key={tag} style={styles.tagChipConstructive}>
                <Text style={styles.tagText}>{t(`ratings.tags.${tag}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avgSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  avgValue: {
    ...typography.textStyles.heading,
    fontSize: normalize(32),
    color: lightTheme.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(4),
    backgroundColor: colors.neutral[50],
    borderRadius: normalize(12),
  },
  trendText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
  },
  reviewCount: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  distributionSection: {
    gap: normalize(4),
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: normalize(2),
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  barLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    width: normalize(12),
    textAlign: 'center',
  },
  barTrack: {
    flex: 1,
    height: normalize(8),
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent.amber[400],
    borderRadius: normalize(4),
  },
  barCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    width: normalize(24),
    textAlign: 'end',
  },
  tagsSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(6),
  },
  tagChipPositive: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    backgroundColor: colors.primary[50],
    borderRadius: normalize(12),
  },
  tagChipConstructive: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    backgroundColor: colors.accent.amber[50],
    borderRadius: normalize(12),
  },
  tagText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutral[600],
  },
});
