import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useCreateTeacher } from '@/features/teachers/hooks/useTeachers';
import { generateUsername } from '@/lib/username';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Create Teacher Screen ───────────────────────────────────────────────────

export default function CreateTeacherScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const createTeacher = useCreateTeacher();

  const handleGenerateUsername = () => {
    if (fullName.trim()) {
      setUsername(generateUsername(fullName));
    }
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('admin.teachers.requiredFields'));
      return;
    }

    try {
      const result = await createTeacher.mutateAsync({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
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

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.teachers.createTitle')}</Text>

        <TextField
          label={t('admin.teachers.fullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('admin.teachers.fullNamePlaceholder')}
        />

        <View style={styles.usernameRow}>
          <View style={styles.usernameField}>
            <TextField
              label={t('admin.teachers.username')}
              value={username}
              onChangeText={setUsername}
              placeholder={t('admin.teachers.usernamePlaceholder')}
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
          label={t('admin.teachers.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('admin.teachers.passwordPlaceholder')}
          secureTextEntry
        />

        <Button
          title={t('admin.teachers.createButton')}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={createTeacher.isPending}
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
