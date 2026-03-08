import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/feedback';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import type { BadgeCategory, StudentBadgeDisplay } from '../types/gamification.types';
import { BadgeCard } from './BadgeCard';

// ─── Category Order ───────────────────────────────────────────────────────────

const CATEGORY_ORDER: BadgeCategory[] = ['enrollment', 'sessions', 'streak'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface BadgeGridProps {
  badges: StudentBadgeDisplay[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { t } = useTranslation();

  if (badges.length === 0) {
    return (
      <EmptyState
        icon="ribbon-outline"
        title={t('gamification.badges.empty')}
      />
    );
  }

  // Group by category
  const grouped = new Map<BadgeCategory, StudentBadgeDisplay[]>();
  for (const badge of badges) {
    const list = grouped.get(badge.category) ?? [];
    list.push(badge);
    grouped.set(badge.category, list);
  }

  return (
    <View style={styles.container}>
      {CATEGORY_ORDER.map((category) => {
        const items = grouped.get(category);
        if (!items || items.length === 0) return null;

        return (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionHeader}>
              {t(`gamification.badges.categories.${category}`)}
            </Text>
            <View style={styles.badgeList}>
              {items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((badge) => (
                  <BadgeCard key={badge.badge_id} badge={badge} />
                ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    ...typography.textStyles.bodyMedium,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[600],
    paddingStart: spacing.xs,
  },
  badgeList: {
    gap: spacing.sm,
  },
});
