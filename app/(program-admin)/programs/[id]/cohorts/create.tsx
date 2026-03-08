import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { TextField, Button } from '@/components/ui';
import { useCreateCohort } from '@/features/programs/hooks/useAdminCohorts';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const cohortSchema = z.object({
  name: z.string().min(1),
  maxStudents: z.number().min(1).max(100),
  teacherId: z.string().uuid(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CohortFormData = z.infer<typeof cohortSchema>;

export default function CreateCohortScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createCohort = useCreateCohort(id!);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CohortFormData>({
    resolver: zodResolver(cohortSchema),
    defaultValues: {
      name: '',
      maxStudents: 10,
      teacherId: '',
      meetingLink: '',
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = async (data: CohortFormData) => {
    if (!id) return;
    const { error } = await createCohort.mutateAsync({
      programId: id,
      name: data.name,
      maxStudents: data.maxStudents,
      teacherId: data.teacherId,
      meetingLink: data.meetingLink || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
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
          <Text style={styles.title}>{t('programs.admin.createCohort')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.cohortName')}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="maxStudents"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.maxStudents')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="teacherId"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.selectTeacher')}
              value={value}
              onChangeText={onChange}
              placeholder="Teacher UUID"
              error={errors.teacherId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="meetingLink"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.meetingLink')}
              value={value}
              onChangeText={onChange}
              keyboardType="url"
            />
          )}
        />

        <Controller
          control={control}
          name="startDate"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.startDate')}
              value={value}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
            />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.endDate')}
              value={value}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
            />
          )}
        />

        <Button
          title={t('common.create')}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          loading={isSubmitting || createCohort.isPending}
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
});
