import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ALL_TRACKS, TRACK_JUZ_COUNT, type HimamTrack } from '../types/himam.types';

interface TrackSelectorProps {
  value: HimamTrack | null;
  onChange: (track: HimamTrack) => void;
}

export function TrackSelector({ value, onChange }: TrackSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('himam.tracks.label')}</Text>
      <View style={styles.chipRow}>
        {ALL_TRACKS.map((track) => {
          const selected = value === track;
          return (
            <Pressable
              key={track}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(track)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t(`himam.tracks.${track}`)} - ${TRACK_JUZ_COUNT[track]} juz`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
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
