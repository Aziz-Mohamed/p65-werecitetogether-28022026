import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProgressScreen() {
  const { t } = useTranslation();

  return (
    <Screen hasTabBar>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dashboard.student.progress')}</Text>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="trending-up-outline" size={64} color={neutral[300]} />
        <Text style={styles.placeholderText}>
          {t('common.noResults')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBlockStart: spacing.lg,
    paddingBlockEnd: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingBlock: spacing['2xl'],
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
