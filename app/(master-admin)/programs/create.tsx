import React from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { TextField, Button } from '@/components/ui';
import { useCreateProgram } from '@/features/programs/hooks/useAdminPrograms';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { ProgramCategory } from '@/features/programs/types/programs.types';

const createSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  category: z.enum(['free', 'structured', 'mixed']),
});

type CreateFormData = z.infer<typeof createSchema>;

export default function MasterAdminCreateProgram() {
  const { t } = useTranslation();
  const router = useRouter();
  const createProgram = useCreateProgram();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      category: 'structured',
    },
  });

  const onSubmit = async (data: CreateFormData) => {
    const { error } = await createProgram.mutateAsync({
      name: data.name,
      name_ar: data.name_ar,
      description: data.description || null,
      description_ar: data.description_ar || null,
      category: data.category as ProgramCategory,
      settings: {
        max_students_per_teacher: 10,
        auto_approve: false,
        session_duration_minutes: 30,
      },
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    router.back();
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.admin.createProgram')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.programName')}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name_ar"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.programNameAr')}
              value={value}
              onChangeText={onChange}
              error={errors.name_ar?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.description')}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />

        <Controller
          control={control}
          name="description_ar"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.descriptionAr')}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text style={styles.pickerLabel}>{t('programs.labels.selectCategory')}</Text>
              <View style={styles.segmentedControl}>
                {(['free', 'structured', 'mixed'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.segment, value === cat && styles.segmentActive]}
                    onPress={() => onChange(cat)}
                  >
                    <Text style={[styles.segmentText, value === cat && styles.segmentTextActive]}>
                      {t(`programs.category.${cat}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Button
          title={t('common.create')}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          loading={isSubmitting || createProgram.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  pickerLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: lightTheme.surface,
  },
  segmentActive: {
    backgroundColor: lightTheme.primary,
  },
  segmentText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
