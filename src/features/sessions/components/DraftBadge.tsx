import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

export function DraftBadge() {
  const { t } = useTranslation();

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{t('sessions.draftBadge')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: normalize(2),
    paddingHorizontal: normalize(8),
    backgroundColor: colors.neutral[100],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(10),
    lineHeight: normalize(14),
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
