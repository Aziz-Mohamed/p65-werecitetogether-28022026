import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WikiTipProps {
  textKey: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WikiTip({ textKey }: WikiTipProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons name="bulb" size={18} color={colors.accent.sky[500]} style={styles.icon} />
      <Text style={styles.text}>{t(textKey)}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.accent.sky[50],
    borderStartWidth: 3,
    borderStartColor: colors.accent.sky[500],
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  icon: {
    marginTop: normalize(1),
  },
  text: {
    ...typography.textStyles.caption,
    color: colors.neutral[700],
    flex: 1,
  },
});
