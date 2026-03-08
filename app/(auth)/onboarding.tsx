import React from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { TextField, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { SupportedLocale } from '@/types/common.types';

// ─── Validation Schema ────────────────────────────────────────────────────────

const onboardingSchema = z.object({
  displayName: z.string().min(2),
  language: z.enum(['en', 'ar']),
  bio: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

// ─── Onboarding Screen ───────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: profile?.full_name ?? '',
      language: (profile?.preferred_language as SupportedLocale) ?? 'en',
      bio: '',
    },
  });

  const completeOnboarding = async (data: OnboardingFormData) => {
    if (!profile?.id) return;

    const updates: Record<string, unknown> = {
      full_name: data.displayName,
      preferred_language: data.language,
      bio: data.bio || null,
      name_localized: { [data.language]: data.displayName },
      onboarding_completed: true,
    };

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      if (__DEV__) {
        console.log('[Onboarding] Update error:', error.message);
      }
      Alert.alert(t('common.error'), t('common.unexpectedError'));
      return;
    }

    if (updatedProfile) {
      setProfile(updatedProfile);
    }

    // Update app locale
    setLocale(data.language as SupportedLocale);
  };

  const skipOnboarding = async () => {
    if (!profile?.id) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true } as never)
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && updatedProfile) {
      setProfile(updatedProfile);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('auth.onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.onboarding.subtitle')}</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, value } }) => (
              <TextField
                label={t('auth.onboarding.displayName')}
                placeholder={t('auth.onboarding.displayNamePlaceholder')}
                value={value}
                onChangeText={onChange}
                error={errors.displayName ? t('auth.validation.fullNameMin') : undefined}
              />
            )}
          />

          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>{t('auth.onboarding.language')}</Text>
            <Controller
              control={control}
              name="language"
              render={({ field: { onChange, value } }) => (
                <View style={styles.languageOptions} accessibilityRole="radiogroup">
                  <Pressable
                    style={[
                      styles.languageOption,
                      value === 'en' && styles.languageOptionSelected,
                    ]}
                    onPress={() => onChange('en')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === 'en' }}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        value === 'en' && styles.languageOptionTextSelected,
                      ]}
                    >
                      {t('common.english')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.languageOption,
                      value === 'ar' && styles.languageOptionSelected,
                    ]}
                    onPress={() => onChange('ar')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === 'ar' }}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        value === 'ar' && styles.languageOptionTextSelected,
                      ]}
                    >
                      {t('common.arabic')}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <TextField
                label={`${t('auth.onboarding.bio')} (${t('common.optional')})`}
                placeholder={t('auth.onboarding.bioPlaceholder')}
                value={value ?? ''}
                onChangeText={onChange}
                multiline
              />
            )}
          />

          <Button
            title={t('auth.onboarding.continue')}
            onPress={handleSubmit(completeOnboarding)}
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
            style={styles.continueButton}
          />

          <Pressable
            onPress={skipOnboarding}
            disabled={isSubmitting}
            style={styles.skipButton}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>{t('auth.onboarding.skip')}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBlockStart: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xs,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBlockEnd: spacing.xl,
  },
  form: {
    gap: spacing.base,
  },
  languageSection: {
    gap: spacing.sm,
  },
  languageLabel: {
    ...typography.textStyles.label,
    color: lightTheme.text,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageOption: {
    flex: 1,
    paddingBlock: spacing.base,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: lightTheme.border,
    alignItems: 'center',
  },
  languageOptionSelected: {
    borderColor: lightTheme.primary,
    backgroundColor: lightTheme.primary + '10',
  },
  languageOptionText: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
  },
  languageOptionTextSelected: {
    color: lightTheme.primary,
  },
  continueButton: {
    marginBlockStart: spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingBlock: spacing.sm,
  },
  skipText: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
  },
});
