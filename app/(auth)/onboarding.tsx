import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '@/components/layout';
import { Button, TextField } from '@/components/ui';
import { Select } from '@/components/forms';
import { useCompleteOnboarding } from '@/features/onboarding/hooks/useOnboarding';
import { onboardingSchema, type OnboardingData } from '@/features/onboarding/types';
import { GENDERS, AGE_RANGES } from '@/lib/constants';
import { typography } from '@/theme/typography';
import { lightTheme, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

const COUNTRIES = [
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'QA', label: 'Qatar' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'OM', label: 'Oman' },
  { value: 'EG', label: 'Egypt' },
  { value: 'JO', label: 'Jordan' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'SY', label: 'Syria' },
  { value: 'PS', label: 'Palestine' },
  { value: 'YE', label: 'Yemen' },
  { value: 'LY', label: 'Libya' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'MA', label: 'Morocco' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SO', label: 'Somalia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { mutate: completeOnboarding, isPending, error } = useCompleteOnboarding();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      gender: 'male',
      ageRange: '18_24',
      country: '',
      region: undefined,
    },
  });

  const onSubmit = (data: OnboardingData) => {
    completeOnboarding(data);
  };

  const genderOptions = GENDERS.map((g) => ({
    value: g,
    label: t(`onboarding.${g}`),
  }));

  const ageRangeOptions = AGE_RANGES.map((ar) => ({
    value: ar,
    label: t(`onboarding.ageRanges.${ar}`),
  }));

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error instanceof Error ? error.message : t('common.error')}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextField
                label={t('onboarding.displayName')}
                placeholder={t('onboarding.displayNamePlaceholder')}
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={styles.fieldLabel}>{t('onboarding.gender')}</Text>
                <View style={styles.radioGroup}>
                  {genderOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.radioOption,
                        value === option.value && styles.radioOptionSelected,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          value === option.value && styles.radioCircleSelected,
                        ]}
                      >
                        {value === option.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          value === option.value && styles.radioLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.gender?.message && (
                  <Text style={styles.fieldError}>{errors.gender.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="ageRange"
            render={({ field: { onChange, value } }) => (
              <Select
                label={t('onboarding.ageRange')}
                placeholder={t('common.select')}
                options={ageRangeOptions}
                value={value || null}
                onChange={onChange}
                error={errors.ageRange?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, value } }) => (
              <Select
                label={t('onboarding.country')}
                placeholder={t('onboarding.countryPlaceholder')}
                options={COUNTRIES}
                value={value || null}
                onChange={onChange}
                error={errors.country?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="region"
            render={({ field: { onChange, value } }) => (
              <TextField
                label={`${t('onboarding.region')} (${t('common.optional')})`}
                placeholder={t('onboarding.regionPlaceholder')}
                value={value ?? ''}
                onChangeText={onChange}
              />
            )}
          />

          <Button
            title={isPending ? t('onboarding.completing') : t('common.done')}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            loading={isPending}
            fullWidth
            style={styles.submitButton}
          />
        </View>
      </View>
    </Screen>
  );
}

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
  errorContainer: {
    backgroundColor: lightTheme.error + '20',
    paddingBlock: spacing.sm,
    paddingInline: spacing.base,
    borderRadius: radius.sm,
    marginBlockEnd: spacing.base,
  },
  errorText: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
  },
  form: {
    gap: spacing.lg,
  },
  fieldLabel: {
    ...typography.textStyles.label,
    color: lightTheme.text,
    marginBlockEnd: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: lightTheme.border,
    flex: 1,
  },
  radioOptionSelected: {
    borderColor: primary[500],
    backgroundColor: primary[50],
  },
  radioCircle: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    borderWidth: 2,
    borderColor: lightTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: primary[500],
  },
  radioInner: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: primary[500],
  },
  radioLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  radioLabelSelected: {
    color: lightTheme.text,
  },
  fieldError: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
    marginBlockStart: spacing.xs,
  },
  submitButton: {
    marginBlockStart: spacing.base,
  },
});
