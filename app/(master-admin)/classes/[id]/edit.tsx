import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { LocalizedNameInput } from '@/components/forms/LocalizedNameInput';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useClassById, useUpdateClass } from '@/features/classes/hooks/useClasses';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { buildNameLocalized, getCanonicalName } from '@/lib/localized-name';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Edit Class Screen ───────────────────────────────────────────────────────

export default function EditClassScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: classData, isLoading, error, refetch } = useClassById(id);
  const { data: teachers = [] } = useTeachers();
  const updateClass = useUpdateClass();

  const [nameLocalized, setNameLocalized] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [maxStudents, setMaxStudents] = useState('30');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (classData) {
      const localized = (classData as any).name_localized;
      setNameLocalized(
        localized && typeof localized === 'object' ? localized : { en: classData.name ?? '' },
      );
      setDescription(classData.description ?? '');
      setTeacherId(classData.teacher_id);
      setMaxStudents(String(classData.max_students ?? 30));
      setIsActive(classData.is_active);
    }
  }, [classData]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!classData) return <ErrorState description={t('admin.classes.notFound')} />;

  const canonicalName = getCanonicalName(nameLocalized);

  const handleSave = async () => {
    if (!canonicalName.trim()) {
      Alert.alert(t('common.error'), t('admin.classes.nameRequired'));
      return;
    }

    await updateClass.mutateAsync({
      id: classData.id,
      input: {
        name: canonicalName.trim(),
        name_localized: buildNameLocalized(nameLocalized),
        description: description.trim() || null,
        teacher_id: teacherId,
        max_students: parseInt(maxStudents, 10) || 30,
        is_active: isActive,
      },
    });

    router.back();
  };

  const teacherOptions = teachers.map((tc: any) => ({
    label: resolveName(tc.name_localized, tc.full_name),
    value: tc.id,
  }));

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.classes.editTitle')}</Text>

        <LocalizedNameInput
          label={t('admin.classes.name')}
          value={nameLocalized}
          onChange={setNameLocalized}
        />

        <TextField
          label={t('admin.classes.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('admin.classes.descriptionPlaceholder')}
          multiline
        />

        <Select
          label={t('admin.classes.teacher')}
          placeholder={t('admin.classes.teacherPlaceholder')}
          options={teacherOptions}
          value={teacherId}
          onChange={setTeacherId}
        />

        <TextField
          label={t('admin.classes.maxStudents')}
          value={maxStudents}
          onChangeText={setMaxStudents}
          keyboardType="numeric"
          placeholder="30"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('common.active')}</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        <Button
          title={t('common.save')}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={updateClass.isPending}
          style={styles.submitButton}
        />
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
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
