import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function MasterAdminReportsScreen() {
  const { t } = useTranslation();
  const { data: programs = [] } = usePrograms();

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('dashboard.masterAdmin.reports')}</Text>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: primary[500] }]}>
              {programs.length}
            </Text>
            <Text style={styles.statLabel}>
              {t('dashboard.masterAdmin.programs')}
            </Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.sky[500] }]}>
              —
            </Text>
            <Text style={styles.statLabel}>
              {t('dashboard.masterAdmin.totalEnrollments')}
            </Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.indigo[500] }]}>
              —
            </Text>
            <Text style={styles.statLabel}>
              {t('dashboard.masterAdmin.totalSessions')}
            </Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.violet[500] }]}>
              —
            </Text>
            <Text style={styles.statLabel}>
              {t('dashboard.masterAdmin.activeTeachers')}
            </Text>
          </Card>
        </View>

        {/* Placeholder for detailed reports */}
        <View style={styles.placeholder}>
          <Ionicons name="bar-chart-outline" size={48} color={neutral[300]} />
          <Text style={styles.placeholderText}>{t('common.comingSoon')}</Text>
          <Text style={styles.placeholderSubtext}>
            {t('dashboard.masterAdmin.reportsDescription')}
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
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: spacing.lg,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(28),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
    marginBlockStart: spacing.xs,
    textAlign: 'center',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBlock: spacing['3xl'],
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  placeholderSubtext: {
    ...typography.textStyles.caption,
    color: neutral[400],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
