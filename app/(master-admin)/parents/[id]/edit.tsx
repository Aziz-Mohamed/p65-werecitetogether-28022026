import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { LocalizedNameInput } from '@/components/forms/LocalizedNameInput';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useParentById, useUpdateParent, useUpdateParentChildren } from '@/features/parents/hooks/useParents';
import { useAvailableStudentsForParent } from '@/features/students/hooks/useStudents';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { buildNameLocalized, getCanonicalName } from '@/lib/localized-name';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Edit Parent Screen ─────────────────────────────────────────────────────

export default function EditParentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: parent, isLoading, error, refetch } = useParentById(id);
  const updateParent = useUpdateParent();
  const updateChildren = useUpdateParentChildren();
  const { data: availableStudents = [] } = useAvailableStudentsForParent(id);

  const [nameLocalized, setNameLocalized] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [childrenError, setChildrenError] = useState('');

  // IDs of students currently linked to this parent (for computing diff)
  const originalStudentIds = useMemo(() => {
    const children = (parent as any)?.students ?? [];
    return children.map((c: any) => c.id) as string[];
  }, [parent]);

  useEffect(() => {
    if (parent) {
      const localized = (parent as any).name_localized;
      setNameLocalized(
        localized && typeof localized === 'object' ? localized : { en: parent.full_name ?? '' },
      );
      setPhone(parent.phone ?? '');
      setSelectedStudentIds(originalStudentIds);
    }
  }, [parent, originalStudentIds]);

  const studentOptions = availableStudents.map((s: any) => ({
    label: resolveName(s.profiles?.name_localized, s.profiles?.full_name) ?? '—',
    value: s.id,
  }));

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!parent) return <ErrorState description={t('admin.parents.notFound')} />;

  const handleStudentChange = (values: string[]) => {
    setSelectedStudentIds(values);
    if (values.length > 0) setChildrenError('');
  };

  const handleSave = async () => {
    if (selectedStudentIds.length === 0) {
      setChildrenError(t('admin.parents.selectChildrenRequired'));
      return;
    }

    try {
      // Update profile info
      const builtLocalized = buildNameLocalized(nameLocalized);
      await updateParent.mutateAsync({
        id: parent.id,
        input: {
          fullName: getCanonicalName(builtLocalized),
          nameLocalized: builtLocalized,
          phone: phone.trim() || undefined,
        },
      });

      // Compute diff for children changes
      const addIds = selectedStudentIds.filter((sid) => !originalStudentIds.includes(sid));
      const removeIds = originalStudentIds.filter((sid) => !selectedStudentIds.includes(sid));

      if (addIds.length > 0 || removeIds.length > 0) {
        await updateChildren.mutateAsync({
          parentId: parent.id,
          addIds,
          removeIds,
        });
      }

      router.back();
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof Error ? err.message : t('common.unexpectedError'),
      );
    }
  };

  const isSaving = updateParent.isPending || updateChildren.isPending;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.parents.editTitle')}</Text>

        <LocalizedNameInput
          label={t('admin.parents.fullName')}
          value={nameLocalized}
          onChange={setNameLocalized}
        />

        <TextField
          label={t('common.phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('common.optional')}
          keyboardType="phone-pad"
        />

        <MultiSelect
          label={t('admin.parents.manageChildren')}
          placeholder={t('admin.parents.selectChildrenPlaceholder')}
          options={studentOptions}
          value={selectedStudentIds}
          onChange={handleStudentChange}
          error={childrenError}
        />

        <Button
          title={t('common.save')}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={isSaving}
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
