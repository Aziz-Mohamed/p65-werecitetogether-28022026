import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { typography } from '@/theme/typography';
import { lightTheme, accent, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function ProgramAdminDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const theme = useRoleTheme();
  const displayName = profile?.display_name ?? profile?.full_name ?? '';

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: displayName })}
            </Text>
          </View>
          <Badge label={t('roles.program_admin')} variant="sky" size="md" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.sky[500] }]}>—</Text>
            <Text style={styles.statLabel}>{t('dashboard.programAdmin.cohorts')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.violet[500] }]}>—</Text>
            <Text style={styles.statLabel}>{t('dashboard.programAdmin.team')}</Text>
          </Card>
        </View>

        {/* Placeholder */}
        <View style={styles.placeholder}>
          <Ionicons name="analytics-outline" size={48} color={neutral[300]} />
          <Text style={styles.placeholderText}>{t('common.comingSoon')}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
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
});
