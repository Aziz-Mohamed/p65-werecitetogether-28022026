import React from 'react';
import { StyleSheet, View, Text, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { TextField, Button } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useUpdateProgram } from '@/features/programs/hooks/useAdminPrograms';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const editSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  max_students_per_teacher: z.number().min(1).max(100),
  auto_approve: z.boolean(),
  session_duration_minutes: z.number().min(5).max(180),
});

type EditFormData = z.infer<typeof editSchema>;

export default function ProgramAdminEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: program, isLoading, error, refetch } = useProgram(id);
  const updateProgram = useUpdateProgram();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: program
      ? {
          name: program.name,
          name_ar: program.name_ar,
          description: program.description ?? '',
          description_ar: program.description_ar ?? '',
          max_students_per_teacher: program.settings?.max_students_per_teacher ?? 10,
          auto_approve: program.settings?.auto_approve ?? false,
          session_duration_minutes: program.settings?.session_duration_minutes ?? 30,
        }
      : undefined,
  });

  const onSubmit = async (data: EditFormData) => {
    if (!id) return;
    const { data: result, error: err } = await updateProgram.mutateAsync({
      programId: id,
      input: {
        name: data.name,
        name_ar: data.name_ar,
        description: data.description || null,
        description_ar: data.description_ar || null,
        settings: {
          max_students_per_teacher: data.max_students_per_teacher,
          auto_approve: data.auto_approve,
          session_duration_minutes: data.session_duration_minutes,
        },
      },
    });

    if (err) {
      Alert.alert(t('common.error'), err.message);
      return;
    }

    router.back();
  };

  if (isLoading) return <LoadingState />;
  if (error || !program) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.admin.editProgram')}</Text>
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
          name="max_students_per_teacher"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.maxPerTeacher')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="session_duration_minutes"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.sessionDuration')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="auto_approve"
          render={({ field: { onChange, value } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('programs.labels.autoApprove')}</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          loading={isSubmitting || updateProgram.isPending}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
});
