import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

interface RevisionWarningProps {
  count: number;
}

export function RevisionWarning({ count }: RevisionWarningProps) {
  const { t } = useTranslation();

  if (count <= 0) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={18} color={secondary[800]} />
      <Text style={styles.text}>
        {t('gamification.revisionWarning', { count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: secondary[100],
    borderRadius: normalize(8),
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: secondary[800],
    flex: 1,
  },
});
