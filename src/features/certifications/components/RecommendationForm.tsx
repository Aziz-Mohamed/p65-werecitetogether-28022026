import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { CertificationType } from '../types/certifications.types';

const certTypes: CertificationType[] = ['ijazah', 'graduation', 'completion'];

const schema = z.object({
  type: z.enum(['ijazah', 'graduation', 'completion']),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RecommendationFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  duplicateExists?: boolean;
  defaultValues?: Partial<FormValues>;
  submitLabel?: string;
}

export function RecommendationForm({
  onSubmit,
  isLoading,
  duplicateExists,
  defaultValues,
  submitLabel,
}: RecommendationFormProps) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: defaultValues?.type ?? 'completion',
      title: defaultValues?.title ?? '',
      titleAr: defaultValues?.titleAr ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  return (
    <View style={styles.container}>
      {duplicateExists && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t('certifications.form.duplicateWarning')}</Text>
        </View>
      )}

      <Text style={styles.label}>{t('certifications.form.certType')}</Text>
      <Controller
        control={control}
        name="type"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <View style={styles.typeRow}>
            {certTypes.map((ct) => (
              <TypeChip
                key={ct}
                label={t(`certifications.types.${ct}`)}
                selected={value === ct}
                onPress={() => onChange(ct)}
              />
            ))}
          </View>
        )}
      />

      <Text style={styles.label}>{t('certifications.form.certTitle')}</Text>
      <Controller
        control={control}
        name="title"
        rules={{ required: true }}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('certifications.form.certTitle')}
            placeholderTextColor={lightTheme.textSecondary}
          />
        )}
      />

      <Text style={styles.label}>{t('certifications.form.certTitleAr')}</Text>
      <Controller
        control={control}
        name="titleAr"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[styles.input, styles.rtlInput]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('certifications.form.certTitleAr')}
            placeholderTextColor={lightTheme.textSecondary}
            textAlign="right"
          />
        )}
      />

      <Text style={styles.label}>{t('certifications.form.notes')}</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('certifications.form.notesPlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}
      />

      <Button
        title={submitLabel ?? t('certifications.form.submit')}
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={duplicateExists}
      />
    </View>
  );
}

function TypeChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <View style={[styles.chip, selected && styles.chipSelected]}>
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        onPress={onPress}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.textStyles.label,
    color: lightTheme.text,
    marginTop: spacing.xs,
  },
  input: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  inputError: {
    borderColor: lightTheme.error,
  },
  rtlInput: {
    writingDirection: 'rtl',
  },
  multiline: {
    minHeight: 100,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: lightTheme.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  chipSelected: {
    backgroundColor: lightTheme.primary,
    borderColor: lightTheme.primary,
  },
  chipText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  warningBox: {
    backgroundColor: colors.secondary[100],
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.secondary[200],
  },
  warningText: {
    ...typography.textStyles.caption,
    color: colors.secondary[700],
  },
});
