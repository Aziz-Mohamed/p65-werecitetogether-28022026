import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { programsService } from '@/features/programs/services/programs.service';
import { useProgramSettings } from '@/features/admin/hooks/useProgramSettings';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { ProgramSettingsInput } from '@/features/admin/types/admin.types';

export default function ProgramAdminSettings() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const updateSettings = useProgramSettings(programId);

  const program = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const { data, error } = await programsService.getProgram(programId!);
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });

  const settings = (program.data?.settings ?? {}) as ProgramSettingsInput;

  const { control, handleSubmit } = useForm<ProgramSettingsInput>({
    values: {
      max_students_per_teacher: settings.max_students_per_teacher ?? 10,
      daily_free_session_limit: settings.daily_free_session_limit ?? 3,
      queue_notification_threshold: settings.queue_notification_threshold ?? 5,
      rating_good_standing: settings.rating_good_standing ?? 4.0,
      rating_warning: settings.rating_warning ?? 3.5,
      rating_concern: settings.rating_concern ?? 3.0,
    },
  });

  const onSubmit = (data: ProgramSettingsInput) => {
    updateSettings.mutate(data, {
      onSuccess: () => Alert.alert(t('common.success'), t('admin.programAdmin.settings.saveSuccess')),
      onError: () => Alert.alert(t('common.error'), t('admin.programAdmin.settings.saveError')),
    });
  };

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('admin.programAdmin.settings.title')}</Text>

        <FieldRow label={t('admin.programAdmin.settings.maxStudentsPerTeacher')} name="max_students_per_teacher" control={control} />
        <FieldRow label={t('admin.programAdmin.settings.dailySessionLimit')} name="daily_free_session_limit" control={control} />
        <FieldRow label={t('admin.programAdmin.settings.queueThreshold')} name="queue_notification_threshold" control={control} />

        <Text style={styles.sectionLabel}>{t('admin.programAdmin.settings.ratingThresholds')}</Text>
        <FieldRow label={t('admin.programAdmin.settings.goodStanding')} name="rating_good_standing" control={control} step={0.1} />
        <FieldRow label={t('admin.programAdmin.settings.warning')} name="rating_warning" control={control} step={0.1} />
        <FieldRow label={t('admin.programAdmin.settings.concern')} name="rating_concern" control={control} step={0.1} />

        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          loading={updateSettings.isPending}
          disabled={updateSettings.isPending}
          style={styles.saveButton}
        />
      </ScrollView>
    </Screen>
  );
}

function FieldRow({ label, name, control, step }: {
  label: string;
  name: keyof ProgramSettingsInput;
  control: ReturnType<typeof useForm<ProgramSettingsInput>>['control'];
  step?: number;
}) {
  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={fieldStyles.input}
            value={String(value ?? '')}
            onChangeText={(text) => {
              const num = step && step < 1 ? parseFloat(text) : parseInt(text, 10);
              if (!isNaN(num)) onChange(num);
            }}
            keyboardType="numeric"
            placeholderTextColor={lightTheme.textSecondary}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

const fieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  label: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  input: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    textAlign: 'auto',
    width: normalize(80),
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
