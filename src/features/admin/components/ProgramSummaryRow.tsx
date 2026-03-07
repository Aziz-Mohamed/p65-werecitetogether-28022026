import React from 'react';
import { I18nManager, Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import type { MasterAdminProgramSummary } from '../types/admin.types';

const CARD_COLORS = [
  colors.primary[500],
  colors.accent.indigo[500],
  colors.accent.violet[500],
  colors.accent.sky[500],
  colors.secondary[500],
  colors.accent.rose[500],
];

interface ProgramSummaryRowProps {
  program: MasterAdminProgramSummary;
  index?: number;
  onPress?: () => void;
}

export function ProgramSummaryRow({ program, index = 0, onPress }: ProgramSummaryRowProps) {
  const { t, i18n } = useTranslation();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const name = i18n.language === 'ar' ? program.name_ar : program.name;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: color + '40', backgroundColor: color + '08' }]}
      accessibilityRole="button"
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.stats}>
          <View style={styles.statPill}>
            <Ionicons name="people" size={12} color={color} />
            <Text style={[styles.statText, { color }]}>
              {t('admin.masterAdmin.dashboard.enrolled', { count: program.enrolled_count })}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="calendar" size={12} color={lightTheme.textSecondary} />
            <Text style={styles.statTextMuted}>
              {t('admin.masterAdmin.dashboard.sessions', { count: program.session_count })}
            </Text>
          </View>
        </View>
      </View>
      {onPress && (
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={color + '80'}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  dot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  statText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
  },
  statTextMuted: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: lightTheme.textSecondary,
  },
});
