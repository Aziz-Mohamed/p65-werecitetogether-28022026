import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import type { HimamTrack } from '../types/himam.types';

const TRACKS: HimamTrack[] = ['3_juz', '5_juz', '10_juz', '15_juz', '30_juz'];

interface HimamTrackPickerProps {
  selectedTrack: HimamTrack | null;
  onSelectTrack: (track: HimamTrack) => void;
}

export function HimamTrackPicker({ selectedTrack, onSelectTrack }: HimamTrackPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('himam.tracks.title')}</Text>
      <View style={styles.grid}>
        {TRACKS.map((track) => {
          const isSelected = selectedTrack === track;
          return (
            <Pressable
              key={track}
              style={[styles.trackOption, isSelected && styles.trackOptionSelected]}
              onPress={() => onSelectTrack(track)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.trackLabel, isSelected && styles.trackLabelSelected]}>
                {t(`himam.tracks.${track}`)}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trackOption: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: neutral[200],
    backgroundColor: neutral[50],
  },
  trackOptionSelected: {
    borderColor: primary[500],
    backgroundColor: primary[50],
  },
  trackLabel: {
    ...typography.textStyles.bodyMedium,
    color: neutral[600],
  },
  trackLabelSelected: {
    color: primary[700],
  },
});
