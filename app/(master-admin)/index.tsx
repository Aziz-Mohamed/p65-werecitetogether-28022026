import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, I18nManager } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

import { StatCard } from '@/features/admin/components/StatCard';
import { ProgramSummaryRow } from '@/features/admin/components/ProgramSummaryRow';
import { useMasterAdminDashboard } from '@/features/admin/hooks/useMasterAdminDashboard';

function NavButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable style={navStyles.button} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={normalize(20)} color={colors.primary[500]} />
      <Text style={navStyles.label}>{label}</Text>
      <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={normalize(16)} color={lightTheme.textSecondary} />
    </Pressable>
  );
}

export default function MasterAdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const dashboard = useMasterAdminDashboard();
  const { logout, isPending: logoutPending } = useLogout();

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()} />
        }
      >
        <Text style={styles.title}>{t('admin.masterAdmin.dashboard.title')}</Text>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.masterAdmin.dashboard.totalStudents')}
            value={dashboard.data?.total_students ?? 0}
            icon="school-outline"
            iconColor={colors.primary[500]}
            isLoading={dashboard.isLoading}
          />
          <StatCard
            label={t('admin.masterAdmin.dashboard.totalTeachers')}
            value={dashboard.data?.total_teachers ?? 0}
            icon="people-outline"
            iconColor={colors.accent.indigo[500]}
            isLoading={dashboard.isLoading}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={t('admin.masterAdmin.dashboard.activeSessions')}
            value={dashboard.data?.total_active_sessions ?? 0}
            icon="pulse-outline"
            iconColor={colors.accent.violet[500]}
            isLoading={dashboard.isLoading}
          />
        </View>

        <View style={styles.navSection}>
          <NavButton label={t('admin.masterAdmin.nav.users')} icon="people-outline" onPress={() => router.push('/(master-admin)/users')} />
          <NavButton label={t('admin.masterAdmin.nav.programs')} icon="library-outline" onPress={() => router.push('/(master-admin)/programs')} />
          <NavButton label={t('admin.masterAdmin.nav.reports')} icon="bar-chart-outline" onPress={() => router.push('/(master-admin)/reports')} />
          <NavButton label={t('admin.masterAdmin.nav.settings')} icon="settings-outline" onPress={() => router.push('/(master-admin)/settings')} />
          <NavButton label={t('admin.masterAdmin.nav.certifications')} icon="ribbon-outline" onPress={() => router.push('/(master-admin)/certifications')} />
        </View>

        <Text style={styles.sectionTitle}>{t('admin.masterAdmin.dashboard.programsOverview')}</Text>

        <View style={styles.programsList}>
          {(dashboard.data?.programs ?? []).map((program, index) => (
            <ProgramSummaryRow
              key={program.program_id}
              program={program}
              index={index}
              onPress={() => router.push('/(master-admin)/programs')}
            />
          ))}
        </View>

        <Button
          title={t('common.signOut')}
          onPress={() => logout()}
          variant="ghost"
          disabled={logoutPending}
          loading={logoutPending}
          style={styles.signOutButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  navSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  programsList: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  signOutButton: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
  },
});

const navStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  label: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
});
