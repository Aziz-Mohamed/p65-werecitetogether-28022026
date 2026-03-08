import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useRTL } from '@/hooks/useRTL';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { normalize } from '@/theme/normalize';
import type { StudentBadgeDisplay } from '../types/gamification.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badge: StudentBadgeDisplay;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BadgeCard({ badge }: BadgeCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const name = isRTL ? badge.name_ar : badge.name_en;
  const description = isRTL ? badge.description_ar : badge.description_en;

  const earnedDate = badge.earned_at
    ? new Date(badge.earned_at).toLocaleDateString(isRTL ? 'ar' : 'en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <View
      style={[styles.card, !badge.earned && styles.cardLocked]}
      accessibilityRole="summary"
      accessibilityState={{ disabled: !badge.earned }}
      accessibilityLabel={`${name}, ${badge.earned ? t('gamification.badges.earned') : t('gamification.badges.locked')}`}
    >
      <View style={[styles.iconContainer, !badge.earned && styles.iconLocked]}>
        <Ionicons
          name={(badge.icon as keyof typeof Ionicons.glyphMap) || 'ribbon'}
          size={normalize(28)}
          color={badge.earned ? colors.primary[500] : colors.neutral[300]}
        />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.name, !badge.earned && styles.textLocked]}
          numberOfLines={1}
        >
          {name}
        </Text>

        {badge.earned && earnedDate ? (
          <Text style={styles.earnedDate}>
            {t('gamification.badges.earnedOn', { date: earnedDate })}
          </Text>
        ) : (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  cardLocked: {
    opacity: 0.6,
    backgroundColor: colors.neutral[50],
  },
  iconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLocked: {
    backgroundColor: colors.neutral[100],
  },
  content: {
    flex: 1,
    gap: normalize(2),
  },
  name: {
    ...typography.textStyles.bodyMedium,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[800],
  },
  textLocked: {
    color: colors.neutral[400],
  },
  earnedDate: {
    ...typography.textStyles.caption,
    color: colors.primary[500],
  },
  description: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
});
