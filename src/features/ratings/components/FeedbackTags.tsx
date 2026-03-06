import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { POSITIVE_TAGS, CONSTRUCTIVE_TAGS } from '../constants/feedback-tags';
import type { FeedbackTag } from '../types/ratings.types';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface FeedbackTagsProps {
  selectedTags: string[];
  onToggleTag: (tagKey: string) => void;
  starRating: number;
}

function TagChip({ tag, selected, onPress }: { tag: FeedbackTag; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const isPositive = tag.category === 'positive';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && (isPositive ? styles.chipSelectedPositive : styles.chipSelectedConstructive),
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
        ]}
      >
        {t(tag.i18nKey)}
      </Text>
    </Pressable>
  );
}

export function FeedbackTags({ selectedTags, onToggleTag, starRating }: FeedbackTagsProps) {
  const { t } = useTranslation();
  const showPositive = starRating >= 3;
  const showConstructive = starRating <= 3;

  return (
    <View style={styles.container}>
      {showPositive && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('ratings.positiveTags')}</Text>
          <View style={styles.tagsRow}>
            {POSITIVE_TAGS.map((tag) => (
              <TagChip
                key={tag.key}
                tag={tag}
                selected={selectedTags.includes(tag.key)}
                onPress={() => onToggleTag(tag.key)}
              />
            ))}
          </View>
        </View>
      )}
      {showConstructive && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('ratings.constructiveTags')}</Text>
          <View style={styles.tagsRow}>
            {CONSTRUCTIVE_TAGS.map((tag) => (
              <TagChip
                key={tag.key}
                tag={tag}
                selected={selectedTags.includes(tag.key)}
                onPress={() => onToggleTag(tag.key)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semiBold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipSelectedPositive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  chipSelectedConstructive: {
    backgroundColor: colors.accent.amber[50],
    borderColor: colors.accent.amber[400],
  },
  chipText: {
    ...typography.textStyles.caption,
    color: lightTheme.text,
  },
  chipTextSelected: {
    fontFamily: typography.fontFamily.semiBold,
  },
});
