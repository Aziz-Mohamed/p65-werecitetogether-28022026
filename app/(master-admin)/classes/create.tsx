import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { LocalizedNameInput } from '@/components/forms/LocalizedNameInput';
import { useAuth } from '@/hooks/useAuth';
import { useCreateClass } from '@/features/classes/hooks/useClasses';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { buildNameLocalized, getCanonicalName } from '@/lib/localized-name';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Create Class Screen ─────────────────────────────────────────────────────

export default function CreateClassScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();

  const [nameLocalized, setNameLocalized] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [maxStudents, setMaxStudents] = useState('30');

  const { resolveName } = useLocalizedName();
  const createClass = useCreateClass();
  const { data: teachers = [] } = useTeachers();

  const canonicalName = getCanonicalName(nameLocalized);

  const handleCreate = async () => {
    if (!canonicalName.trim()) {
      Alert.alert(t('common.error'), t('admin.classes.nameRequired'));
      return;
    }

    const { data, error } = await createClass.mutateAsync({
      input: {
        name: canonicalName.trim(),
        name_localized: buildNameLocalized(nameLocalized),
        description: description.trim() || undefined,
        teacher_id: teacherId,
        max_students: parseInt(maxStudents, 10) || 30,
      },
      schoolId: profile?.school_id ?? '',
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

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

        <Text style={styles.title}>{t('admin.classes.createTitle')}</Text>

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

        <Button
          title={t('admin.classes.createButton')}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={createClass.isPending}
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
  submitButton: {
    marginTop: spacing.md,
  },
});
