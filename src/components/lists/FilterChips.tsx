import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterChip {
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (value: string) => void;
  style?: ViewStyle;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FilterChips({ chips, selected, onSelect, style }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={[styles.container, style]}
    >
      {chips.map((chip) => {
        const isActive = chip.value === selected;
        return (
          <Pressable
            key={chip.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(chip.value);
            }}
            style={[
              styles.chip,
              isActive && styles.chipActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: lightTheme.surface,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: lightTheme.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
});
