import React, { useCallback, useState, useEffect } from 'react';
import { I18nManager, StyleSheet, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useChangeLanguage } from '@/hooks/useChangeLanguage';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { useTeacherProfile } from '@/features/teacher-availability/hooks/useTeacherProfile';
import { useUpdateTeacherProfile } from '@/features/teacher-availability/hooks/useUpdateTeacherProfile';
import type { MeetingPlatform } from '@/features/teacher-availability/types/availability.types';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

const PLATFORMS: MeetingPlatform[] = ['google_meet', 'zoom', 'jitsi', 'other'];
const LANGUAGE_OPTIONS = [
  { code: 'ar', en: 'Arabic', ar: 'العربية' },
  { code: 'en', en: 'English', ar: 'الإنجليزية' },
  { code: 'ur', en: 'Urdu', ar: 'الأردية' },
  { code: 'fr', en: 'French', ar: 'الفرنسية' },
  { code: 'tr', en: 'Turkish', ar: 'التركية' },
  { code: 'ms', en: 'Malay', ar: 'الملايوية' },
  { code: 'id', en: 'Indonesian', ar: 'الإندونيسية' },
  { code: 'bn', en: 'Bengali', ar: 'البنغالية' },
];

// ─── Teacher Profile ──────────────────────────────────────────────────────────

export default function TeacherProfile() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const theme = useRoleTheme();
  const { logout, isPending: isLoggingOut } = useLogout();
  const { locale, toggleLanguage } = useChangeLanguage();
  const { resolveName } = useLocalizedName();
  const { data: teacherProfile } = useTeacherProfile();
  const updateProfile = useUpdateTeacherProfile();

  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform>('google_meet');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    if (teacherProfile) {
      setMeetingLink(teacherProfile.meeting_link ?? '');
      setMeetingPlatform(teacherProfile.meeting_platform ?? 'google_meet');
      setSelectedLanguages(teacherProfile.languages ?? []);
    }
  }, [teacherProfile]);

  const handleSaveMeetingSettings = () => {
    if (meetingLink && !meetingLink.startsWith('https://')) {
      Alert.alert(t('common.error'), 'Meeting link must start with https://');
      return;
    }
    updateProfile.mutate({
      meetingLink: meetingLink || undefined,
      meetingPlatform,
      languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
    });
  };

  const toggleLang = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('teacher.profile.title')}</Text>

        {/* Profile Info */}
        <Card variant="primary-glow" style={styles.profileCard}>
          <Avatar
            name={resolveName(profile?.name_localized, profile?.full_name)}
            size="xl"
            ring
            variant={theme.tag}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{resolveName(profile?.name_localized, profile?.full_name) ?? '—'}</Text>
            <Text style={styles.profileUsername}>@{profile?.username ?? '—'}</Text>
          </View>
          <Badge label={t('roles.teacher')} variant={theme.tag} size="md" />
        </Card>

        {/* Help Guide */}
        <Card
          variant="default"
          style={styles.settingCard}
          onPress={() => router.push('/(teacher)/wiki')}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="help-circle" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.settingLabel}>{t('wiki.profileLink')}</Text>
            </View>
            <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.neutral[300]} />
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
            <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.neutral[300]} />
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
              <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.neutral[300]} />
            </View>
          </View>
        </Card>

        {/* Meeting Settings */}
        <Text style={styles.sectionTitle}>{t('availability.meetingSettings')}</Text>

        <Card variant="default" style={styles.meetingCard}>
          {/* Meeting Link */}
          <Text style={styles.fieldLabel}>{t('availability.meetingLink')}</Text>
          <TextInput
            style={styles.textInput}
            value={meetingLink}
            onChangeText={setMeetingLink}
            placeholder={t('availability.meetingLinkPlaceholder')}
            placeholderTextColor={colors.neutral[400]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {/* Meeting Platform */}
          <Text style={styles.fieldLabel}>{t('availability.meetingPlatform')}</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setMeetingPlatform(p)}
                style={[
                  styles.platformChip,
                  meetingPlatform === p && styles.platformChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.platformChipText,
                    meetingPlatform === p && styles.platformChipTextActive,
                  ]}
                >
                  {t(`availability.platformLabels.${p}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Languages */}
          <Text style={styles.fieldLabel}>{t('availability.languages')}</Text>
          <View style={styles.platformRow}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => toggleLang(lang.code)}
                style={[
                  styles.platformChip,
                  selectedLanguages.includes(lang.code) && styles.platformChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.platformChipText,
                    selectedLanguages.includes(lang.code) && styles.platformChipTextActive,
                  ]}
                >
                  {i18n.language === 'ar' ? lang.ar : lang.en}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title={t('common.save')}
            onPress={handleSaveMeetingSettings}
            variant="primary"
            size="md"
            loading={updateProfile.isPending}
          />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  meetingCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  fieldLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[700],
  },
  textInput: {
    ...typography.textStyles.body,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: normalize(8),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.neutral[900],
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  platformChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  platformChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  platformChipText: {
    ...typography.textStyles.label,
    color: colors.neutral[600],
  },
  platformChipTextActive: {
    color: colors.primary[700],
  },
  footer: {
    marginTop: spacing.xl,
  },
  signOutButton: {
    backgroundColor: colors.accent.rose[50],
  },
});
