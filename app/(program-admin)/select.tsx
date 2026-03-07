import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { useRoleTheme } from '@/hooks/useRoleTheme';
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
  const theme = useRoleTheme();
  const userId = session?.user?.id;
  const { data: programs, isLoading } = useProgramAdminPrograms(userId);
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const { resolveFirstName } = useLocalizedName();

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  if (!isLoading && (programs ?? []).length === 0) {
    return (
      <Screen scroll>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })}
              </Text>
              <Text style={styles.subtitle}>{t('admin.programAdmin.selector.title')}</Text>
            </View>
            <Badge label={t('roles.program_admin')} variant={theme.tag} size="md" />
          </View>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="folder-open-outline" size={48} color={colors.neutral[300]} />
            </View>
            <Text style={styles.emptyText}>{t('admin.programAdmin.selector.empty')}</Text>
            <Text style={styles.emptyDescription}>{t('admin.programAdmin.selector.emptyDescription')}</Text>
          </View>

          {/* Settings */}
          <View style={styles.navSection}>
            <Pressable style={styles.navRow} onPress={toggleLanguage}>
              <Ionicons name="language" size={normalize(20)} color={colors.accent.indigo[500]} />
              <Text style={styles.navLabel}>{t('common.language')}</Text>
              <Text style={styles.navValue}>
                {locale === 'en' ? t('common.english') : t('common.arabic')}
              </Text>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={normalize(16)}
                color={colors.neutral[300]}
              />
            </Pressable>
          </View>

          {/* Sign Out */}
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyIconContainer: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
  navSection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  navLabel: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  navValue: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    marginRight: spacing.xs,
  },
  signOutButton: {
    backgroundColor: colors.accent.rose[50],
  },
});
