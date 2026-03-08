import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { useRTL } from '@/hooks/useRTL';
import type { ProgramAdminProgram } from '../types/admin.types';

interface ProgramSelectorProps {
  programs: ProgramAdminProgram[];
  onSelect: (programId: string) => void;
  isLoading?: boolean;
}

export function ProgramSelector({ programs, onSelect, isLoading }: ProgramSelectorProps) {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();

  useEffect(() => {
    if (programs.length === 1 && programs[0].programs) {
      onSelect(programs[0].programs.id);
    }
  }, [programs, onSelect]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.programAdmin.selector.title')}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.programAdmin.selector.title')}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('admin.programAdmin.selector.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.programAdmin.selector.title')}</Text>
      <FlatList
        data={programs}
        keyExtractor={(item) => item.program_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const program = item.programs;
          if (!program) return null;

          const name = i18n.language === 'ar' ? program.name_ar : program.name;

          return (
            <Card
              variant="outlined"
              onPress={() => onSelect(program.id)}
              style={styles.card}
            >
              <Text style={styles.programName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.category}>
                {program.category}
              </Text>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  list: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  category: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
