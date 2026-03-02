import React, { useCallback, useState } from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useGuardians, useAddGuardian, useUpdateGuardian, useRemoveGuardian } from '@/features/guardians/hooks/useGuardians';
import { GuardianList } from '@/features/guardians/components/GuardianList';
import { GuardianForm } from '@/features/guardians/components/GuardianForm';
import type { StudentGuardian } from '@/features/guardians/types/guardians.types';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function StudentProfile() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const theme = useRoleTheme();
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<StudentGuardian | null>(null);

  const { data: guardians = [] } = useGuardians(profile?.id);
  const addGuardianMutation = useAddGuardian();
  const updateGuardianMutation = useUpdateGuardian(profile?.id);
  const removeGuardianMutation = useRemoveGuardian(profile?.id);

  const displayName = profile?.display_name || profile?.full_name || '';

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        <Card variant="primary-glow" style={styles.profileCard}>
          <Avatar
            name={displayName}
            size="xl"
            ring
            variant={theme.tag as any}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || '—'}</Text>
            {profile?.email && (
              <Text style={styles.profileEmail}>{profile.email}</Text>
            )}
          </View>
          <Badge label={t('roles.student')} variant={theme.tag as any} size="md" />
        </Card>

        <Text style={styles.sectionTitle}>{t('profile.demographics')}</Text>

        <Card variant="default" style={styles.infoCard}>
          <InfoRow
            icon="person-outline"
            label={t('onboarding.gender')}
            value={profile?.gender ? t(`onboarding.${profile.gender}`) : '—'}
          />
          <InfoRow
            icon="calendar-outline"
            label={t('onboarding.ageRange')}
            value={
              profile?.age_range
                ? t(`onboarding.ageRanges.${profile.age_range}`)
                : '—'
            }
          />
          <InfoRow
            icon="globe-outline"
            label={t('onboarding.country')}
            value={profile?.country || '—'}
          />
          {profile?.region && (
            <InfoRow
              icon="location-outline"
              label={t('onboarding.region')}
              value={profile.region}
            />
          )}
        </Card>

        {/* Guardians Section */}
        <View style={styles.guardianHeader}>
          <Text style={styles.sectionTitle}>{t('guardians.title')}</Text>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setEditingGuardian(null);
              setShowGuardianForm(!showGuardianForm);
            }}
            title={showGuardianForm ? t('common.cancel') : t('guardians.addGuardian')}
          />
        </View>

        {showGuardianForm && (
          <Card variant="default" style={styles.infoCard}>
            <GuardianForm
              studentId={profile?.id}
              mode={editingGuardian ? 'edit' : 'create'}
              initialValues={editingGuardian ? {
                guardian_name: editingGuardian.guardian_name,
                guardian_phone: editingGuardian.guardian_phone ?? '',
                guardian_email: editingGuardian.guardian_email ?? '',
                relationship: editingGuardian.relationship as any,
                is_primary: editingGuardian.is_primary,
              } : undefined}
              loading={addGuardianMutation.isPending || updateGuardianMutation.isPending}
              onSubmit={(values) => {
                if (editingGuardian) {
                  updateGuardianMutation.mutate(
                    { guardianId: editingGuardian.id, input: values },
                    { onSuccess: () => { setShowGuardianForm(false); setEditingGuardian(null); } },
                  );
                } else {
                  addGuardianMutation.mutate(values as any, {
                    onSuccess: () => setShowGuardianForm(false),
                  });
                }
              }}
            />
          </Card>
        )}

        <GuardianList
          guardians={guardians}
          onEdit={(guardian) => {
            setEditingGuardian(guardian);
            setShowGuardianForm(true);
          }}
          onRemove={(id) => removeGuardianMutation.mutate(id)}
          removeLoading={removeGuardianMutation.isPending}
        />

        <Text style={styles.sectionTitle}>{t('common.settings')}</Text>

        <Card variant="default" style={styles.settingCard} onPress={toggleLanguage}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIcon, { backgroundColor: colors.accent.violet[50] }]}>
                <Ionicons name="language" size={20} color={colors.accent.violet[500]} />
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.neutral[400]} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  profileEmail: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.md,
    fontSize: normalize(16),
  },
  guardianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    flex: 1,
  },
  infoValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
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
