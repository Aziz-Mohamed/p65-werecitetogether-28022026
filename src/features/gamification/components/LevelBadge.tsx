import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface LevelBadgeProps {
  level: number;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const { t } = useTranslation();
  const progress = level / 240;

  return (
    <View style={styles.container}>
      <Text style={styles.levelText}>
        {t('gamification.levelLabel', { level, total: 240 })}
      </Text>
      <ProgressBar progress={progress} variant="primary" height={8} />
      <Text style={styles.subText}>
        {t('gamification.rubCertified', { count: level })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  levelText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(18),
    color: colors.neutral[900],
  },
  subText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },
});
