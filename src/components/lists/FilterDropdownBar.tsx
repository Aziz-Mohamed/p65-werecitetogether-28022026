import React, { useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  selected: string; // 'all' means no filter active
  onSelect: (value: string) => void;
}

interface FilterDropdownBarProps {
  filters: FilterGroup[];
  style?: ViewStyle;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FilterDropdownBar({ filters, style }: FilterDropdownBarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const activeCount = filters.filter((f) => f.selected !== 'all').length;

  const handleOpen = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenFilter(key);
  }, []);

  const handleClose = useCallback(() => {
    setOpenFilter(null);
  }, []);

  const handleClearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    filters.forEach((f) => f.onSelect('all'));
  }, [filters]);

  const currentFilter = filters.find((f) => f.key === openFilter);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.container, style]}
      >
        {activeCount > 0 && (
          <Pressable style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="close-circle" size={16} color={lightTheme.textSecondary} />
          </Pressable>
        )}

        {filters.map((filter) => {
          const isActive = filter.selected !== 'all';
          const selectedOption = filter.options.find((o) => o.value === filter.selected);
          const displayLabel = isActive ? selectedOption?.label ?? filter.label : filter.label;

          return (
            <Pressable
              key={filter.key}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => handleOpen(filter.key)}
              accessibilityRole="button"
              accessibilityLabel={`${filter.label} filter`}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
                numberOfLines={1}
              >
                {displayLabel}
              </Text>
              {isActive ? (
                <Pressable
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    filter.onSelect('all');
                  }}
                >
                  <Ionicons name="close-circle" size={16} color={colors.primary[700]} />
                </Pressable>
              ) : (
                <Ionicons name="chevron-down" size={14} color={lightTheme.textSecondary} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Option picker modal */}
      <Modal
        visible={!!openFilter}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <View style={styles.sheet}>
            {currentFilter && (
              <>
                <Text style={styles.sheetTitle}>{currentFilter.label}</Text>
                <ScrollView style={styles.optionsList} bounces={false}>
                  {currentFilter.options.map((option) => {
                    const isSelected = currentFilter.selected === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          currentFilter.onSelect(option.value);
                          handleClose();
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.primary[500]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: lightTheme.surface,
    borderWidth: 1,
    borderColor: lightTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: lightTheme.surface,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  filterText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: lightTheme.textSecondary,
    maxWidth: 140,
  },
  filterTextActive: {
    color: colors.primary[700],
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: lightTheme.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxHeight: '60%',
  },
  sheetTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    color: lightTheme.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  optionsList: {
    paddingHorizontal: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginVertical: 1,
  },
  optionRowSelected: {
    backgroundColor: colors.primary[50],
  },
  optionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    color: lightTheme.text,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary[700],
  },
});
