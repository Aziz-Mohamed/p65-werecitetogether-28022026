import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface ProgramChipProps {
  programName: string | null;
  programNameAr: string | null;
}

export function ProgramChip({ programName, programNameAr }: ProgramChipProps) {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const displayName = isArabic
    ? (programNameAr ?? programName ?? t('sessions.programUnavailable'))
    : (programName ?? programNameAr ?? t('sessions.programUnavailable'));

  return (
    <View style={styles.chip}>
      <Ionicons name="school-outline" size={12} color={colors.primary[500]} />
      <Text style={styles.text} numberOfLines={1}>{displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingVertical: normalize(3),
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(11),
    lineHeight: normalize(16),
    color: colors.primary[700],
  },
});
