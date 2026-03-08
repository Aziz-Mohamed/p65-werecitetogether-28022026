import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useStudentById, useUpdateStudent } from '@/features/students/hooks/useStudents';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { useStudentGuardians, useAddGuardian, useDeleteGuardian } from '@/features/profile/hooks/useGuardians';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Edit Student Screen ─────────────────────────────────────────────────────

export default function EditStudentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: student, isLoading, error, refetch } = useStudentById(id);
  const { data: classes = [] } = useClasses({ isActive: true });
  const { data: guardians = [] } = useStudentGuardians(id);
  const addGuardian = useAddGuardian();
  const deleteGuardian = useDeleteGuardian();
  const updateStudent = useUpdateStudent();

  const [classId, setClassId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Guardian form
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  useEffect(() => {
    if (student) {
      setClassId(student.class_id);
      setIsActive(student.is_active);
      setDateOfBirth(student.date_of_birth ?? '');
    }
  }, [student]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!student) return <ErrorState description={t('admin.students.notFound')} />;

  const handleSave = async () => {
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

    const { error: updateError } = await updateStudent.mutateAsync({
      id: student.id,
      input: {
        classId,
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

  const handleAddGuardian = async () => {
    if (!guardianName.trim()) return;
    await addGuardian.mutateAsync({
      studentId: id!,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim() || undefined,
      isPrimary: guardians.length === 0,
    });
    setGuardianName('');
    setGuardianPhone('');
  };

  const handleRemoveGuardian = (guardianId: string) => {
    Alert.alert(t('common.confirm'), t('admin.guardians.removeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: () => deleteGuardian.mutate({ id: guardianId, studentId: id! }),
      },
    ]);
  };

  const classOptions = classes.map((c: any) => ({
    label: resolveName(c.name_localized, c.name) ?? c.name,
    value: c.id,
  }));

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader title={t('admin.students.editTitle')} />
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

        {/* Guardian Management */}
        <Text style={styles.sectionTitle}>{t('admin.guardians.title')}</Text>
        {guardians.map((g: any) => (
          <Card key={g.id} variant="outlined" style={styles.guardianCard}>
            <View style={styles.guardianRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.guardianName}>{g.guardian_name}</Text>
                {g.guardian_phone && (
                  <Text style={styles.guardianPhone}>{g.guardian_phone}</Text>
                )}
              </View>
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.accent.rose[400]}
                onPress={() => handleRemoveGuardian(g.id)}
              />
            </View>
          </Card>
        ))}
        <View style={styles.addGuardianRow}>
          <TextField
            label={t('admin.guardians.name')}
            value={guardianName}
            onChangeText={setGuardianName}
            placeholder={t('admin.guardians.namePlaceholder')}
          />
          <TextField
            label={t('admin.guardians.phone')}
            value={guardianPhone}
            onChangeText={setGuardianPhone}
            placeholder={t('admin.guardians.phonePlaceholder')}
          />
          <Button
            title={t('admin.guardians.add')}
            onPress={handleAddGuardian}
            variant="secondary"
            size="sm"
            loading={addGuardian.isPending}
            disabled={!guardianName.trim()}
          />
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
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  guardianCard: {
    padding: spacing.sm,
  },
  guardianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guardianName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  guardianPhone: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  addGuardianRow: {
    gap: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
