import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Select } from '@/components/forms/Select';
import { LoadingState, ErrorState } from '@/components/feedback';
import { authService } from '@/features/auth/services/auth.service';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Reset Password Screen ──────────────────────────────────────────────────

export default function ResetPasswordScreen() {
  const { t } = useTranslation();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resolveName } = useLocalizedName();
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();

  const teacherLabel = t('roles.teacher');
  const studentLabel = t('roles.student');
  const userOptions = [
    ...teachers.map((tc: any) => ({
      label: `${resolveName(tc.name_localized, tc.full_name)} (${teacherLabel})`,
      value: tc.id,
    })),
    ...students.map((s: any) => ({
      label: `${resolveName(s.profiles?.name_localized, s.profiles?.full_name) ?? '—'} (${studentLabel})`,
      value: s.profiles?.id ?? s.id,
    })),
  ];

  const handleReset = async () => {
    if (!selectedUserId || !newPassword.trim()) {
      Alert.alert(t('common.error'), t('admin.resetPassword.requiredFields'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('admin.resetPassword.minLength'));
      return;
    }

    setIsSubmitting(true);
    const result = await authService.resetMemberPassword({
      userId: selectedUserId,
      newPassword,
    });
    setIsSubmitting(false);

    if (result.error) {
      Alert.alert(t('common.error'), result.error.message);
      return;
    }

    Alert.alert(t('common.success'), t('admin.resetPassword.success'));
    setNewPassword('');
    setSelectedUserId(null);
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader title={t('admin.resetPassword.title')} />
        <Text style={styles.description}>{t('admin.resetPassword.description')}</Text>

        <Select
          label={t('admin.resetPassword.selectUser')}
          placeholder={t('admin.resetPassword.selectUserPlaceholder')}
          options={userOptions}
          value={selectedUserId}
          onChange={setSelectedUserId}
        />

        <TextField
          label={t('admin.resetPassword.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('admin.resetPassword.newPasswordPlaceholder')}
          secureTextEntry
        />

        <Button
          title={t('admin.resetPassword.resetButton')}
          onPress={handleReset}
          variant="primary"
          size="lg"
          loading={isSubmitting}
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
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
