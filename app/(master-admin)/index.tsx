import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme, accent, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function MasterAdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: programs = [] } = usePrograms();

  const displayName = profile?.display_name ?? profile?.full_name ?? '';

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: displayName })}
            </Text>
          </View>
          <Badge label={t('roles.master_admin')} variant="success" size="md" />
        </View>

        {/* Stats */}
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
              {t('dashboard.masterAdmin.users')}
            </Text>
          </Card>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>
          {t('common.actions')}
        </Text>

        <Card
          variant="default"
          onPress={() => router.push('/(master-admin)/programs')}
          style={styles.linkCard}
        >
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: accent.indigo[50] }]}>
              <Ionicons name="library" size={22} color={accent.indigo[500]} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>
                {t('dashboard.masterAdmin.programs')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={neutral[300]} />
          </View>
        </Card>

        <Card
          variant="default"
          onPress={() => router.push('/(master-admin)/users')}
          style={styles.linkCard}
        >
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: accent.violet[50] }]}>
              <Ionicons name="people" size={22} color={accent.violet[500]} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>
                {t('dashboard.masterAdmin.users')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={neutral[300]} />
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBlockEnd: spacing.xs,
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
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  linkCard: {
    padding: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  linkIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
});
