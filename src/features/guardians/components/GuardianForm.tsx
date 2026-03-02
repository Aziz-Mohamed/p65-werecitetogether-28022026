import React from 'react';
import { StyleSheet, View, Text, TextInput, Switch, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/Button';
import type { GuardianRelationship, AddGuardianInput, UpdateGuardianInput } from '../types/guardians.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const guardianSchema = z.object({
  guardian_name: z.string().min(1),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().email().optional().or(z.literal('')),
  relationship: z.enum(['parent', 'guardian', 'grandparent', 'sibling', 'other']),
  is_primary: z.boolean(),
}).refine(
  (data) => !!(data.guardian_phone || data.guardian_email),
  { message: 'At least one of phone or email is required', path: ['guardian_phone'] },
);

type FormValues = z.infer<typeof guardianSchema>;

const RELATIONSHIPS: GuardianRelationship[] = ['parent', 'guardian', 'grandparent', 'sibling', 'other'];

interface GuardianFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (values: AddGuardianInput | UpdateGuardianInput) => void;
  loading?: boolean;
  studentId?: string;
  mode?: 'create' | 'edit';
}

export function GuardianForm({ initialValues, onSubmit, loading, studentId, mode = 'create' }: GuardianFormProps) {
  const { t } = useTranslation();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
      relationship: 'parent',
      is_primary: false,
      ...initialValues,
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    if (mode === 'create' && studentId) {
      onSubmit({ ...values, student_id: studentId } as AddGuardianInput);
    } else {
      onSubmit(values as UpdateGuardianInput);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('guardians.name')}</Text>
      <Controller
        control={control}
        name="guardian_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.guardian_name && styles.inputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('guardians.namePlaceholder')}
            placeholderTextColor={neutral[400]}
          />
        )}
      />

      <Text style={styles.label}>{t('guardians.phone')}</Text>
      <Controller
        control={control}
        name="guardian_phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.guardian_phone && styles.inputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('guardians.phonePlaceholder')}
            placeholderTextColor={neutral[400]}
            keyboardType="phone-pad"
          />
        )}
      />
      {errors.guardian_phone && (
        <Text style={styles.error}>{t('guardians.phoneOrEmailRequired')}</Text>
      )}

      <Text style={styles.label}>{t('guardians.email')}</Text>
      <Controller
        control={control}
        name="guardian_email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.guardian_email && styles.inputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t('guardians.emailPlaceholder')}
            placeholderTextColor={neutral[400]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Text style={styles.label}>{t('guardians.relationship')}</Text>
      <Controller
        control={control}
        name="relationship"
        render={({ field: { onChange, value } }) => (
          <View style={styles.relationshipRow}>
            {RELATIONSHIPS.map((rel) => (
              <Pressable
                key={rel}
                style={[styles.relationshipChip, value === rel && styles.relationshipChipActive]}
                onPress={() => onChange(rel)}
              >
                <Text
                  style={[styles.relationshipText, value === rel && styles.relationshipTextActive]}
                >
                  {t(`guardians.relationships.${rel}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="is_primary"
        render={({ field: { onChange, value } }) => (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('guardians.isPrimary')}</Text>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />

      <Button
        variant="primary"
        onPress={handleSubmit(handleFormSubmit)}
        loading={loading}
        style={styles.submitButton}
        title={mode === 'create' ? t('common.add') : t('common.save')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.textStyles.caption, color: neutral[500], marginTop: spacing.xs },
  input: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  inputError: { borderColor: '#ef4444' },
  error: { ...typography.textStyles.caption, color: '#ef4444' },
  relationshipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  relationshipChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: neutral[200],
  },
  relationshipChipActive: {
    borderColor: lightTheme.primary,
    backgroundColor: lightTheme.primary + '10',
  },
  relationshipText: { ...typography.textStyles.caption, color: neutral[500] },
  relationshipTextActive: { color: lightTheme.primary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchLabel: { ...typography.textStyles.body, color: lightTheme.text },
  submitButton: { marginTop: spacing.md },
});
