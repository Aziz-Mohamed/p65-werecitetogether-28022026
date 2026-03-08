import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { useRTL } from '@/hooks/useRTL';
import type { ProgramAdminProgram } from '../types/admin.types';

const CARD_COLORS = [
  colors.primary[500],
  colors.accent.indigo[500],
  colors.accent.violet[500],
  colors.accent.sky[500],
  colors.secondary[500],
  colors.accent.rose[500],
];

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
        renderItem={({ item, index }) => {
          const program = item.programs;
          if (!program) return null;

          const name = i18n.language === 'ar' ? program.name_ar : program.name;
          const color = CARD_COLORS[index % CARD_COLORS.length];

          return (
            <Pressable
              onPress={() => onSelect(program.id)}
              style={[styles.card, { borderColor: color + '40', backgroundColor: color + '08' }]}
              accessibilityRole="button"
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.programName} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.category}>
                  {program.category}
                </Text>
              </View>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={color + '80'}
              />
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  dot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
  },
  cardTextContainer: {
    flex: 1,
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
