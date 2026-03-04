import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CategoryBadge } from './CategoryBadge';
import { useLocalizedField } from '../utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { Program } from '../types/programs.types';

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
}

export function ProgramCard({ program, onPress }: ProgramCardProps) {
  const localize = useLocalizedField();

  return (
    <Card variant="outlined" style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {localize(program.name, program.name_ar)}
          </Text>
          <CategoryBadge category={program.category} />
        </View>
      </View>
      {(program.description || program.description_ar) && (
        <Text style={styles.description} numberOfLines={2}>
          {localize(program.description, program.description_ar)}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    flex: 1,
  },
  description: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(4),
  },
});
