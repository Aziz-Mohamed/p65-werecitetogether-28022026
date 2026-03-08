import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useProgramDemand } from '../hooks/useProgramDemand';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface DemandIndicatorProps {
  programId: string;
  programName: string;
  programNameAr?: string;
}

export function DemandIndicator({ programId, programName, programNameAr }: DemandIndicatorProps) {
  const { t, i18n } = useTranslation();
  const displayName = i18n.language === 'ar' ? (programNameAr ?? programName) : programName;
  const { data } = useProgramDemand(programId);

  if (!data || data.waiting_count === 0) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="people" size={normalize(16)} color={colors.accent.amber[600]} />
      <View style={styles.textContainer}>
        <Text style={styles.programName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.demandText}>
          {t('queue.demand.studentsWaiting', { count: data.waiting_count })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent.amber[50],
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: colors.accent.amber[200],
  },
  textContainer: {
    flex: 1,
    gap: normalize(1),
  },
  programName: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[700],
  },
  demandText: {
    ...typography.textStyles.caption,
    color: colors.accent.amber[600],
    fontFamily: typography.fontFamily.medium,
  },
});
