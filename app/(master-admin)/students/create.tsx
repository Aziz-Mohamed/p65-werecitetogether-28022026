import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { DatePicker } from '@/components/forms/DatePicker';
import { LocalizedNameInput } from '@/components/forms/LocalizedNameInput';
import { useCreateStudent } from '@/features/students/hooks/useStudents';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { generateUsername } from '@/lib/username';
import { buildNameLocalized, getCanonicalName } from '@/lib/localized-name';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Create Student Screen ───────────────────────────────────────────────────

export default function CreateStudentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [nameLocalized, setNameLocalized] = useState<Record<string, string>>({});
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  const { resolveName } = useLocalizedName();
  const createStudent = useCreateStudent();
  const { data: classes = [] } = useClasses({ isActive: true });

  const canonicalName = getCanonicalName(nameLocalized);

  const handleGenerateUsername = () => {
    if (canonicalName.trim()) {
      setUsername(generateUsername(canonicalName));
    }
  };

  const handleCreate = async () => {
    if (!canonicalName.trim() || !username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('admin.students.requiredFields'));
      return;
    }

    try {
      const result = await createStudent.mutateAsync({
        fullName: canonicalName.trim(),
        username: username.trim(),
        password,
        nameLocalized: buildNameLocalized(nameLocalized),
        classId: classId ?? undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
      });

      if (result.error) {
        Alert.alert(t('common.error'), result.error.message);
        return;
      }

      router.back();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.unexpectedError'),
      );
    }
  };

  const classOptions = classes.map((c: any) => ({
    label: resolveName(c.name_localized, c.name) ?? c.name,
    value: c.id,
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

        <Text style={styles.title}>{t('admin.students.createTitle')}</Text>

        <LocalizedNameInput
          label={t('admin.students.fullName')}
          value={nameLocalized}
          onChange={setNameLocalized}
        />

        <View style={styles.usernameRow}>
          <View style={styles.usernameField}>
            <TextField
              label={t('admin.students.username')}
              value={username}
              onChangeText={setUsername}
              placeholder={t('admin.students.usernamePlaceholder')}
              autoCapitalize="none"
            />
          </View>
          <Button
            title={t('admin.students.generate')}
            onPress={handleGenerateUsername}
            variant="secondary"
            size="sm"
            icon={<Ionicons name="refresh-outline" size={16} color={colors.primary[500]} />}
            style={styles.generateButton}
          />
        </View>

        <TextField
          label={t('admin.students.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('admin.students.passwordPlaceholder')}
          secureTextEntry
        />

        <Select
          label={t('admin.students.class')}
          placeholder={t('admin.students.classPlaceholder')}
          options={classOptions}
          value={classId}
          onChange={setClassId}
        />

        <DatePicker
          label={t('admin.students.dateOfBirth')}
          value={dateOfBirth}
          onChange={setDateOfBirth}
          maximumDate={new Date()}
        />

        <Button
          title={t('admin.students.createButton')}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={createStudent.isPending}
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  usernameField: {
    flex: 1,
  },
  generateButton: {
    marginBottom: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
