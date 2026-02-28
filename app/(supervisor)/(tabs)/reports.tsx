import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SupervisorReportsScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('supervisor.reports')}</Text>

        <Card variant="outlined" style={styles.comingSoon}>
          <Ionicons name="bar-chart-outline" size={48} color={neutral[300]} />
          <Text style={styles.comingSoonTitle}>
            {t('supervisor.reportsComingSoon')}
          </Text>
          <Text style={styles.comingSoonText}>
            {t('supervisor.reportsComingSoonDesc')}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  comingSoon: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBlock: spacing['3xl'],
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  comingSoonText: {
    ...typography.textStyles.caption,
    color: neutral[500],
    textAlign: 'center',
  },
});
