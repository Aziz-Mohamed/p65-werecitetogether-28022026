import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function TeacherCirclesScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('dashboard.teacher.circles')}</Text>
        <View style={styles.placeholder}>
          <Ionicons name="ellipse-outline" size={48} color={neutral[300]} />
          <Text style={styles.placeholderText}>
            {t('common.comingSoon')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xl,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBlock: spacing['4xl'],
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
