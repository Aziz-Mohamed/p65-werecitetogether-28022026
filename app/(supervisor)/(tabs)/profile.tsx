import React, { useCallback } from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { supabase } from '@/lib/supabase';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface ProgramInfo {
  program_id: string;
  program_name: string;
  teacher_count: number;
}

export default function SupervisorProfile() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session, profile } = useAuth();
  const theme = useRoleTheme();
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const { resolveName } = useLocalizedName();
  const userId = session?.user?.id;

  const programs = useQuery({
    queryKey: ['supervisor-programs', userId],
    queryFn: async () => {
      const { data: roles, error: roleError } = await supabase
        .from('program_roles')
        .select(`
          program_id,
          programs ( name, name_ar )
        `)
        .eq('profile_id', userId!)
        .eq('role', 'supervisor');

      if (roleError) throw roleError;
      if (!roles) return [];

      const programIds = roles.map((r: { program_id: string }) => r.program_id);
      const { data: teamData } = await supabase
        .from('program_roles')
        .select('program_id, profile_id')
        .in('program_id', programIds)
        .eq('role', 'teacher');

      return roles.map((r: { program_id: string; programs: { name: string; name_ar: string } | null }) => ({
        program_id: r.program_id,
        program_name: (i18n.language === 'ar' ? r.programs?.name_ar : r.programs?.name) ?? '',
        teacher_count: (teamData ?? []).filter((tc: { program_id: string }) => tc.program_id === r.program_id).length,
      })) as ProgramInfo[];
    },
    enabled: !!userId,
  });

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  const displayName = resolveName(profile?.name_localized, profile?.full_name);

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.supervisor.profile.title')}</Text>

        {/* Profile Info */}
        <Card variant="primary-glow" style={styles.profileCard}>
          <Avatar
            name={displayName}
            size="xl"
            ring
            variant={theme.tag}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName ?? '—'}</Text>
            <Text style={styles.profileUsername}>@{profile?.username ?? '—'}</Text>
          </View>
          <Badge label={t('roles.supervisor')} variant={theme.tag} size="md" />
        </Card>

        {/* Help Guide */}
        <Card
          variant="default"
          style={styles.settingCard}
          onPress={() => router.push('/(supervisor)/wiki')}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="help-circle" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.settingLabel}>{t('wiki.profileLink')}</Text>
            </View>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.neutral[300]} />
          </View>
        </Card>

        {/* Settings Group */}
        <Text style={styles.sectionTitle}>{t('common.settings')}</Text>

        {/* Notification Preferences */}
        <Card
          variant="default"
          style={styles.settingCard}
          onPress={() => router.push('/notification-preferences')}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent.sky[50] }]}>
                <Ionicons name="notifications" size={20} color={colors.accent.sky[500]} />
              </View>
              <Text style={styles.settingLabel}>{t('notifications.preferences.title')}</Text>
            </View>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.neutral[300]} />
          </View>
        </Card>

        {/* Language */}
        <Card variant="default" style={styles.settingCard} onPress={toggleLanguage}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent.indigo[50] }]}>
                <Ionicons name="language" size={20} color={colors.accent.indigo[500]} />
              </View>
              <Text style={styles.settingLabel}>{t('common.language')}</Text>
            </View>
            <View style={styles.languageValue}>
              <Text style={styles.languageText}>
                {locale === 'en' ? t('common.english') : t('common.arabic')}
              </Text>
              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.neutral[300]} />
            </View>
          </View>
        </Card>

        {/* Supervised Programs */}
        <Text style={styles.sectionTitle}>{t('admin.supervisor.profile.supervisedPrograms')}</Text>

        {(programs.data ?? []).map((item) => (
          <Card key={item.program_id} variant="default" style={styles.programCard}>
            <Text style={styles.programName}>{item.program_name}</Text>
            <Text style={styles.programTeachers}>
              {t('admin.supervisor.profile.teachersInProgram', { count: item.teacher_count })}
            </Text>
          </Card>
        ))}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
    marginBottom: spacing.sm,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: normalize(2),
  },
  profileName: {
    ...typography.textStyles.heading,
    color: colors.neutral[900],
    fontSize: normalize(22),
  },
  profileUsername: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.md,
    fontSize: normalize(16),
  },
  settingCard: {
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languageText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
  },
  programCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  programTeachers: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  footer: {
    marginTop: spacing.xl,
  },
  signOutButton: {
    backgroundColor: colors.accent.rose[50],
  },
});
