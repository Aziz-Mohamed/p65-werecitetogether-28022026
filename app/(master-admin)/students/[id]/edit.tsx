import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useStudentById, useUpdateStudent } from '@/features/students/hooks/useStudents';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { useParents } from '@/features/parents/hooks/useParents';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Edit Student Screen ─────────────────────────────────────────────────────

export default function EditStudentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: student, isLoading, error, refetch } = useStudentById(id);
  const { data: classes = [] } = useClasses({ isActive: true });
  const { data: parents = [] } = useParents();
  const updateStudent = useUpdateStudent();

  const [classId, setClassId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    if (student) {
      setClassId(student.class_id);
      setParentId(student.parent_id);
      setIsActive(student.is_active);
      setDateOfBirth(student.date_of_birth ?? '');
    }
  }, [student]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!student) return <ErrorState description={t('admin.students.notFound')} />;

  const handleSave = async () => {
    // T115: Class capacity check
    if (classId && classId !== student.class_id) {
      const targetClass = classes.find((c: any) => c.id === classId);
      if (targetClass && targetClass.max_students) {
        const currentCount = targetClass.students?.length ?? 0;
        if (currentCount >= targetClass.max_students) {
          Alert.alert(t('common.error'), t('admin.classes.classFull'));
          return;
        }
      }
    }

    const { data, error: updateError } = await updateStudent.mutateAsync({
      id: student.id,
      input: {
        classId,
        parentId,
        isActive,
        dateOfBirth: dateOfBirth || undefined,
      },
    });

    if (updateError) {
      Alert.alert(t('common.error'), updateError.message);
      return;
    }

    router.back();
  };

  const classOptions = classes.map((c: any) => ({
    label: resolveName(c.name_localized, c.name) ?? c.name,
    value: c.id,
  }));

  const parentOptions = parents.map((p: any) => ({
    label: resolveName(p.name_localized, p.full_name),
    value: p.id,
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

        <Text style={styles.title}>{t('admin.students.editTitle')}</Text>
        <Text style={styles.subtitle}>
          {resolveName((student as any).profiles?.name_localized, (student as any).profiles?.full_name)}
        </Text>

        <Select
          label={t('admin.students.class')}
          placeholder={t('admin.students.classPlaceholder')}
          options={classOptions}
          value={classId}
          onChange={setClassId}
        />

        <Select
          label={t('admin.students.parent')}
          placeholder={t('admin.students.parentPlaceholder')}
          options={parentOptions}
          value={parentId}
          onChange={setParentId}
        />

        <TextField
          label={t('admin.students.dateOfBirth')}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder={t('common.dateFormat')}
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
          loading={updateStudent.isPending}
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
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
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
