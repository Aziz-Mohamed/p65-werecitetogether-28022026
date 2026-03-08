import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CategoryBadge } from './CategoryBadge';
import { useLocalizedField } from '../utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { ProgramWithTracks } from '../types/programs.types';

interface ProgramDetailHeaderProps {
  program: ProgramWithTracks;
}

export function ProgramDetailHeader({ program }: ProgramDetailHeaderProps) {
  const localize = useLocalizedField();

  const description = localize(program.description, program.description_ar);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.name}>
          {localize(program.name, program.name_ar)}
        </Text>
        <CategoryBadge category={program.category} />
      </View>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
