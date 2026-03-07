import React, { useCallback } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { ProgramSelector } from '@/features/admin/components/ProgramSelector';
import { useProgramAdminPrograms } from '@/features/admin/hooks/useProgramAdminPrograms';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function ProgramAdminSelect() {
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const { data: programs, isLoading } = useProgramAdminPrograms(userId);
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const { resolveName } = useLocalizedName();

  const displayName = resolveName(profile?.name_localized, profile?.full_name);

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  if (!isLoading && (programs ?? []).length === 0) {
    return (
      <Screen scroll>
        <View style={styles.container}>
          <Text style={styles.title}>{t('admin.programAdmin.selector.title')}</Text>

          {/* Profile Card */}
          <Card variant="primary-glow" style={styles.profileCard}>
            <Avatar name={displayName} size="xl" ring variant="sky" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName ?? '—'}</Text>
              <Text style={styles.profileUsername}>@{profile?.username ?? '—'}</Text>
            </View>
            <Badge label={t('roles.program_admin')} variant="sky" size="md" />
          </Card>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>{t('admin.programAdmin.selector.empty')}</Text>
            <Text style={styles.emptyDescription}>{t('admin.programAdmin.selector.emptyDescription')}</Text>
          </View>

          {/* Language Toggle */}
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
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color={colors.neutral[300]}
                />
              </View>
            </View>
          </Card>

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

  return (
    <Screen>
      <ProgramSelector
        programs={programs ?? []}
        isLoading={isLoading}
        onSelect={(programId) => {
          router.replace({
            pathname: '/(program-admin)/(tabs)',
            params: { programId },
          });
        }}
      />
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    textAlign: 'center',
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
  footer: {
    marginTop: spacing.xl,
  },
  signOutButton: {
    backgroundColor: colors.accent.rose[50],
  },
});
