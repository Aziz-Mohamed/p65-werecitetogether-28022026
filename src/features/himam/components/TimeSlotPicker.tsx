import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';

const PRAYER_BLOCKS = [
  'fajr_dhuhr',
  'dhuhr_asr',
  'asr_maghrib',
  'maghrib_isha',
  'isha_fajr',
] as const;

type PrayerBlock = (typeof PRAYER_BLOCKS)[number];

interface TimeSlotPickerProps {
  selectedBlocks: PrayerBlock[];
  onToggleBlock: (block: PrayerBlock) => void;
}

export function TimeSlotPicker({ selectedBlocks, onToggleBlock }: TimeSlotPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('himam.timeSlots.title')}</Text>
      <Text style={styles.subtitle}>{t('himam.timeSlots.selectSlots')}</Text>

      <View style={styles.grid}>
        {PRAYER_BLOCKS.map((block) => {
          const isSelected = selectedBlocks.includes(block);
          return (
            <Pressable
              key={block}
              style={[styles.slot, isSelected && styles.slotSelected]}
              onPress={() => onToggleBlock(block)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={20}
                color={isSelected ? primary[500] : neutral[400]}
              />
              <Text style={[styles.slotLabel, isSelected && styles.slotLabelSelected]}>
                {t(`himam.timeSlots.${block}`)}
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
  title: {
    ...typography.textStyles.label,
    color: lightTheme.text,
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  grid: {
    gap: spacing.sm,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: neutral[200],
    backgroundColor: neutral[50],
  },
  slotSelected: {
    borderColor: primary[500],
    backgroundColor: primary[50],
  },
  slotLabel: {
    ...typography.textStyles.body,
    color: neutral[600],
  },
  slotLabelSelected: {
    color: primary[700],
  },
});
