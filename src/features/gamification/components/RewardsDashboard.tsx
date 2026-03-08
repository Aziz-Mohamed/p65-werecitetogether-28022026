import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback';
import { useRTL } from '@/hooks/useRTL';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { RewardsDashboard as RewardsDashboardData } from '../types/gamification.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RewardsDashboardProps {
  data: RewardsDashboardData;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RewardsDashboard({ data }: RewardsDashboardProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const hasData =
    data.stickers_this_week > 0 ||
    data.stickers_this_month > 0 ||
    data.top_teachers.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon="gift-outline"
        title={t('gamification.rewardsDashboard.noData')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticker Counts */}
      <View style={styles.countsRow}>
        <CountCard
          label={t('gamification.rewardsDashboard.stickersThisWeek')}
          value={data.stickers_this_week}
          icon="today-outline"
        />
        <CountCard
          label={t('gamification.rewardsDashboard.stickersThisMonth')}
          value={data.stickers_this_month}
          icon="calendar-outline"
        />
      </View>

      {/* Top Teachers */}
      {data.top_teachers.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('gamification.rewardsDashboard.topTeachers')}
          </Text>
          {data.top_teachers.map((teacher, index) => (
            <View key={teacher.teacher_id} style={styles.listRow}>
              <Text style={styles.listRank}>{index + 1}.</Text>
              <Text style={styles.listName} numberOfLines={1}>
                {teacher.full_name}
              </Text>
              <Text style={styles.listValue}>
                {t('gamification.rewardsDashboard.awards', {
                  count: teacher.award_count,
                })}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Popular Stickers */}
      {data.popular_stickers.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('gamification.rewardsDashboard.popularStickers')}
          </Text>
          {data.popular_stickers.map((sticker, index) => (
            <View key={sticker.sticker_id} style={styles.listRow}>
              <Text style={styles.listRank}>{index + 1}.</Text>
              <Text style={styles.listName} numberOfLines={1}>
                {isRTL ? sticker.name_ar : sticker.name_en}
              </Text>
              <Text style={styles.listValue}>
                {t('gamification.rewardsDashboard.awards', {
                  count: sticker.award_count,
                })}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Badge Distribution */}
      {data.badge_distribution.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('gamification.rewardsDashboard.milestones')}
          </Text>
          {data.badge_distribution.map((badge) => (
            <View key={badge.badge_id} style={styles.listRow}>
              <Text style={styles.listName} numberOfLines={1}>
                {isRTL ? badge.name_ar : badge.name_en}
              </Text>
              <Text style={styles.listValue}>
                {t('gamification.rewardsDashboard.earned', {
                  count: badge.earned_count,
                })}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

// ─── Count Card ───────────────────────────────────────────────────────────────

function CountCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card style={styles.countCard}>
      <Ionicons name={icon} size={normalize(20)} color={colors.primary[500]} />
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  countsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  countCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countValue: {
    ...typography.textStyles.heading,
    color: colors.neutral[800],
    fontSize: normalize(28),
  },
  countLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  section: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  listRank: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[400],
    width: normalize(24),
  },
  listName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[700],
    flex: 1,
  },
  listValue: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semiBold,
  },
});
