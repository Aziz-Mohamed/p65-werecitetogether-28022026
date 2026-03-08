import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ALL_PRAYER_SLOTS, type PrayerTimeSlot } from '../types/himam.types';

interface TimeSlotSelectorProps {
  value: PrayerTimeSlot[];
  onChange: (slots: PrayerTimeSlot[]) => void;
}

export function TimeSlotSelector({ value, onChange }: TimeSlotSelectorProps) {
  const { t } = useTranslation();

  const toggleSlot = (slot: PrayerTimeSlot) => {
    if (value.includes(slot)) {
      onChange(value.filter((s) => s !== slot));
    } else {
      onChange([...value, slot]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('himam.prayerTimes.label')}</Text>
      <View style={styles.chipRow}>
        {ALL_PRAYER_SLOTS.map((slot) => {
          const selected = value.includes(slot);
          return (
            <Pressable
              key={slot}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleSlot(slot)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`himam.prayerTimes.${slot}`)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(`himam.prayerTimes.${slot}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: lightTheme.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: lightTheme.primary + '15',
    borderColor: lightTheme.primary,
  },
  chipText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: lightTheme.primary,
    fontWeight: '600',
  },
});
