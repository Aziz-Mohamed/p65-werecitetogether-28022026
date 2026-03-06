import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { TRACK_JUZ_COUNT, type HimamTrack } from '../types/himam.types';

interface JuzPickerProps {
  value: number[];
  onChange: (juz: number[]) => void;
  track: HimamTrack | null;
}

export function JuzPicker({ value, onChange, track }: JuzPickerProps) {
  const { t } = useTranslation();

  const maxCount = track ? TRACK_JUZ_COUNT[track] : 0;
  const is30Juz = track === '30_juz';

  const toggleJuz = (num: number) => {
    if (is30Juz) return;
    if (value.includes(num)) {
      onChange(value.filter((j) => j !== num));
    } else if (value.length < maxCount) {
      onChange([...value, num].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onChange(Array.from({ length: 30 }, (_, i) => i + 1));
  };

  if (!track) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{t('himam.juzPicker.label')}</Text>
        <Text style={styles.count}>
          {t('himam.juzPicker.selected', { count: value.length })} / {maxCount}
        </Text>
      </View>

      {is30Juz ? (
        <Pressable style={styles.selectAllButton} onPress={selectAll}>
          <Text style={styles.selectAllText}>{t('himam.juzPicker.selectAll')}</Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => {
            const selected = value.includes(num);
            const disabled = !selected && value.length >= maxCount;
            return (
              <Pressable
                key={num}
                style={[
                  styles.juzCell,
                  selected && styles.juzCellSelected,
                  disabled && styles.juzCellDisabled,
                ]}
                onPress={() => toggleJuz(num)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={t('himam.juzPicker.juzNumber', { number: num })}
              >
                <Text
                  style={[
                    styles.juzText,
                    selected && styles.juzTextSelected,
                    disabled && styles.juzTextDisabled,
                  ]}
                >
                  {num}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  count: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  juzCell: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: lightTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  juzCellSelected: {
    backgroundColor: lightTheme.primary + '15',
    borderColor: lightTheme.primary,
  },
  juzCellDisabled: {
    opacity: 0.4,
  },
  juzText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '500',
  },
  juzTextSelected: {
    color: lightTheme.primary,
    fontWeight: '700',
  },
  juzTextDisabled: {
    color: lightTheme.textSecondary,
  },
  selectAllButton: {
    backgroundColor: lightTheme.primary + '15',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: lightTheme.primary,
  },
  selectAllText: {
    ...typography.textStyles.body,
    color: lightTheme.primary,
    fontWeight: '600',
  },
});
