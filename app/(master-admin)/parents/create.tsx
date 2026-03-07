import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { LocalizedNameInput } from '@/components/forms/LocalizedNameInput';
import { useCreateParent } from '@/features/parents/hooks/useParents';
import { useAvailableStudentsForParent } from '@/features/students/hooks/useStudents';
import { generateUsername } from '@/lib/username';
import { buildNameLocalized, getCanonicalName } from '@/lib/localized-name';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Create Parent Screen ───────────────────────────────────────────────────

export default function CreateParentScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [nameLocalized, setNameLocalized] = useState<Record<string, string>>({});
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [childrenError, setChildrenError] = useState('');

  const { resolveName } = useLocalizedName();
  const createParent = useCreateParent();
  const { data: availableStudents = [] } = useAvailableStudentsForParent();

  const studentOptions = availableStudents.map((s: any) => ({
    label: resolveName(s.profiles?.name_localized, s.profiles?.full_name) ?? '—',
    value: s.id,
  }));

  const canonicalName = getCanonicalName(nameLocalized);

  const handleGenerateUsername = () => {
    if (canonicalName.trim()) {
      setUsername(generateUsername(canonicalName));
    }
  };

  const handleStudentChange = (values: string[]) => {
    setSelectedStudentIds(values);
    if (values.length > 0) setChildrenError('');
  };

  const handleCreate = async () => {
    if (!canonicalName.trim() || !username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('admin.parents.requiredFields'));
      return;
    }

    if (selectedStudentIds.length === 0) {
      setChildrenError(t('admin.parents.selectChildrenRequired'));
      return;
    }

    try {
      const result = await createParent.mutateAsync({
        fullName: canonicalName.trim(),
        username: username.trim(),
        password,
        nameLocalized: buildNameLocalized(nameLocalized),
        studentIds: selectedStudentIds,
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

        <Text style={styles.title}>{t('admin.parents.createTitle')}</Text>

        <LocalizedNameInput
          label={t('admin.parents.fullName')}
          value={nameLocalized}
          onChange={setNameLocalized}
        />

        <View style={styles.usernameRow}>
          <View style={styles.usernameField}>
            <TextField
              label={t('admin.parents.username')}
              value={username}
              onChangeText={setUsername}
              placeholder={t('admin.parents.usernamePlaceholder')}
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
          label={t('admin.parents.password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('admin.parents.passwordPlaceholder')}
          secureTextEntry
        />

        <MultiSelect
          label={t('admin.parents.selectChildren')}
          placeholder={t('admin.parents.selectChildrenPlaceholder')}
          options={studentOptions}
          value={selectedStudentIds}
          onChange={handleStudentChange}
          error={childrenError}
        />

        <Button
          title={t('admin.parents.createButton')}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={createParent.isPending}
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
