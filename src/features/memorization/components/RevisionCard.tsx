import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/ui/Card';
import { RecitationTypeChip } from './RecitationTypeChip';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { getSurah, formatVerseRange } from '@/lib/quran-metadata';
import type { RevisionScheduleItem } from '../types/memorization.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RevisionCardProps {
  item: RevisionScheduleItem;
  onPress?: (item: RevisionScheduleItem) => void;
  style?: ViewStyle;
}

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  new: {
    color: colors.accent.indigo[600],
    bg: colors.accent.indigo[50],
  },
  learning: {
    color: colors.secondary[700],
    bg: colors.secondary[50],
  },
  memorized: {
    color: colors.semantic.success,
    bg: colors.primary[100],
  },
  needs_review: {
    color: colors.semantic.warning,
    bg: colors.secondary[100],
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RevisionCard({ item, onPress, style }: RevisionCardProps) {
  const { t, i18n } = useTranslation();
  const surah = getSurah(item.surah_number);
  const statusConfig = STATUS_STYLES[item.status] ?? STATUS_STYLES.new;
  const isArabic = i18n.language === 'ar';

  const verseRange = formatVerseRange(item.surah_number, item.from_ayah, item.to_ayah, isArabic ? 'ar' : 'en');
  const hasScores =
    item.avg_accuracy != null || item.avg_tajweed != null || item.avg_fluency != null;

  const primaryName = isArabic
    ? (surah?.nameArabic ?? '')
    : (surah?.nameEnglish ?? `Surah ${item.surah_number}`);
  const secondaryName = isArabic
    ? (surah?.nameEnglish ?? `Surah ${item.surah_number}`)
    : (surah?.nameArabic ?? '');

  const content = (
    <Card variant="default" style={StyleSheet.flatten([styles.root, style])}>
      {/* Top Row: Surah Info + Type Chip */}
      <View style={styles.topRow}>
        <View style={styles.surahInfo}>
          <Text style={isArabic ? styles.surahArabic : styles.surahPrimary}>{primaryName}</Text>
          <Text style={isArabic ? styles.surahSecondary : styles.surahArabicSecondary}>{secondaryName}</Text>
        </View>
        <RecitationTypeChip type={item.review_type} />
      </View>

      {/* Verse Range */}
      <Text style={styles.verseRange}>{verseRange}</Text>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {t(`memorization.status.${item.status}`)}
          </Text>
        </View>
        {item.review_count > 0 && (
          <Text style={styles.reviewCount}>
            {t('memorization.reviewCount', { count: item.review_count })}
          </Text>
        )}
      </View>

      {/* Scores Row */}
      {hasScores && (
        <View style={styles.scoresRow}>
          {item.avg_accuracy != null && (
            <View style={styles.scoreItem}>
              <Ionicons name="locate-outline" size={normalize(14)} color={colors.primary[500]} />
              <Text style={styles.scoreLabel}>Acc</Text>
              <Text style={styles.scoreValue}>{item.avg_accuracy.toFixed(1)}</Text>
            </View>
          )}
          {item.avg_tajweed != null && (
            <View style={styles.scoreItem}>
              <Ionicons name="book-outline" size={normalize(14)} color={colors.accent.violet[500]} />
              <Text style={styles.scoreLabel}>Taj</Text>
              <Text style={styles.scoreValue}>{item.avg_tajweed.toFixed(1)}</Text>
            </View>
          )}
          {item.avg_fluency != null && (
            <View style={styles.scoreItem}>
              <Ionicons name="mic-outline" size={normalize(14)} color={colors.accent.sky[500]} />
              <Text style={styles.scoreLabel}>Flu</Text>
              <Text style={styles.scoreValue}>{item.avg_fluency.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${surah?.nameEnglish ?? 'Surah'} ${verseRange}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  surahInfo: {
    flex: 1,
    gap: normalize(2),
  },
  surahArabic: {
    fontFamily: typography.fontFamily.arabicBold,
    fontSize: typography.fontSize.lg,
    color: lightTheme.text,
  },
  surahPrimary: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: lightTheme.text,
  },
  surahSecondary: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: lightTheme.textSecondary,
  },
  surahArabicSecondary: {
    fontFamily: typography.fontFamily.arabic,
    fontSize: typography.fontSize.sm,
    color: lightTheme.textSecondary,
  },
  verseRange: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.xs,
  },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(10),
    textTransform: 'uppercase',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(2),
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(10),
    color: lightTheme.textTertiary,
  },
  scoreValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: lightTheme.textSecondary,
  },
  reviewCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: lightTheme.textTertiary,
    marginStart: 'auto',
  },
});
