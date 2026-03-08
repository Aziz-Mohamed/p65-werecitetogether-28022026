import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAdminDashboard } from '@/features/dashboard/hooks/useAdminDashboard';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const theme = useRoleTheme();
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const { resolveFirstName } = useLocalizedName();

  const { data, isLoading, error, refetch } = useAdminDashboard(profile?.school_id);

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })} 👋
            </Text>
            <Text style={styles.subtitle}>{t('admin.dashboard.subtitle')}</Text>
          </View>
          <Badge label={t('roles.admin')} variant={theme.tag} size="md" />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label={t('admin.dashboard.totalStudents')} value={data?.totalStudents ?? 0} color={theme.primary} icon="people" />
          <StatCard label={t('admin.dashboard.totalTeachers')} value={data?.totalTeachers ?? 0} color={colors.accent.indigo[500]} icon="school" />
          <StatCard label={t('admin.dashboard.totalClasses')} value={data?.totalClasses ?? 0} color={colors.accent.violet[500]} icon="albums" />
          <StatCard label={t('admin.dashboard.attendanceRate')} value={`${data?.todayAttendanceRate ?? 0}%`} color={colors.accent.rose[500]} icon="checkmark-done" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionsRow}>
          <ActionButton
            title={t('admin.addStudent')}
            onPress={() => router.push('/(admin)/students/create')}
            icon="person-add"
            color={theme.primary}
          />
          <ActionButton
            title={t('admin.addTeacher')}
            onPress={() => router.push('/(admin)/teachers/create')}
            icon="school"
            color={colors.accent.indigo[500]}
          />
          <ActionButton
            title={t('admin.addClass')}
            onPress={() => router.push('/(admin)/classes/create')}
            icon="add-circle"
            color={colors.accent.violet[500]}
          />
          <ActionButton
            title={t('admin.addParent')}
            onPress={() => router.push('/(admin)/parents/create')}
            icon="people"
            color={colors.accent.rose[500]}
          />
        </View>

        {/* Management Navigation */}
        <Text style={styles.sectionTitle}>{t('admin.dashboard.manage')}</Text>
        <View style={styles.navGrid}>
          <NavCard 
            title={t('admin.students.title')} 
            icon="people" 
            onPress={() => router.push('/(admin)/students')} 
            color={theme.primary}
          />
          <NavCard 
            title={t('admin.teachers.title')} 
            icon="person-circle" 
            onPress={() => router.push('/(admin)/teachers')} 
            color={colors.accent.indigo[500]}
          />
          <NavCard
            title={t('admin.parents.title')}
            icon="people"
            onPress={() => router.push('/(admin)/parents')}
            color={colors.accent.rose[500]}
          />
          <NavCard
            title={t('admin.classes.title')}
            icon="albums"
            onPress={() => router.push('/(admin)/classes')}
            color={colors.accent.violet[500]}
          />
          <NavCard 
            title={t('admin.stickers.title')} 
            icon="star" 
            onPress={() => router.push('/(admin)/stickers')} 
            color={colors.gamification.gold}
          />
          <NavCard 
            title={t('reports.title')} 
            icon="bar-chart" 
            onPress={() => router.push('/(admin)/reports')} 
            color={colors.accent.rose[500]}
          />
          <NavCard
            title={t('admin.permissions.title')}
            icon="toggle"
            onPress={() => router.push('/(admin)/settings/permissions')}
            color={colors.accent.sky[500]}
          />
          <NavCard
            title={t('admin.dashboard.resetPassword')}
            icon="key"
            onPress={() => router.push('/(admin)/members/reset-password')}
            color={colors.neutral[500]}
          />
          <Card variant="default" style={styles.navCard} onPress={toggleLanguage}>
            <View style={styles.navContent}>
              <View style={[styles.navIcon, { backgroundColor: colors.accent.indigo[500] + '10' }]}>
                <Ionicons name="language" size={20} color={colors.accent.indigo[500]} />
              </View>
              <Text style={styles.navText}>{t('common.language')}</Text>
              <Text style={styles.langValue}>
                {locale === 'en' ? t('common.english') : t('common.arabic')}
              </Text>
              <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.neutral[300]} />
            </View>
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.footer}>
          <Button
            title={t('common.signOut')}
            onPress={handleSignOut}
            variant="ghost"
            size="md"
            icon={<Ionicons name="log-out-outline" size={20} color={colors.accent.rose[500]} />}
            style={styles.signOutButton}
            loading={isLoggingOut}
          />
        </View>
      </View>
    </Screen>
  );
}

function StatCard({ label, value, color, icon }: { label: string, value: string | number, color: string, icon: any }) {
  return (
    <Card variant="default" style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Card>
  );
}

function ActionButton({ title, icon, color, onPress }: { title: string, icon: any, color: string, onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionText} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

function NavCard({ title, icon, color, onPress }: { title: string, icon: any, color: string, onPress: () => void }) {
  return (
    <Card variant="default" style={styles.navCard} onPress={onPress}>
      <View style={styles.navContent}>
        <View style={[styles.navIcon, { backgroundColor: color + '10' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.navText} numberOfLines={1}>{title}</Text>
        <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.neutral[300]} />
      </View>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    ...typography.textStyles.heading,
    color: colors.neutral[900],
    fontSize: normalize(22),
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statIconContainer: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(8),
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(24),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(4),
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: colors.neutral[800],
    fontSize: normalize(18),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.textStyles.label,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
  },
  navGrid: {
    gap: spacing.md,
  },
  navCard: {
    padding: spacing.md,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    flex: 1,
  },
  langValue: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    marginRight: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
  },
  signOutButton: {
    backgroundColor: colors.accent.rose[50],
  },
});
