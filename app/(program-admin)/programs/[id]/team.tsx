import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge, TextField } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useProgramRoles, useAssignProgramRole, useRemoveProgramRole } from '@/features/programs/hooks/useProgramRoles';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { ProgramRoleWithProfile, ProgramRoleType } from '@/features/programs/types/programs.types';

export default function TeamManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const { data: roles = [], isLoading, error, refetch } = useProgramRoles(id);
  const assignRole = useAssignProgramRole(id!);
  const removeRole = useRemoveProgramRole(id!);

  const [showAddForm, setShowAddForm] = useState(false);
  const [profileId, setProfileId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  const handleAssign = () => {
    if (!profileId || !userId) return;
    assignRole.mutate(
      { input: { profileId, programId: id!, role: selectedRole }, assignedBy: userId },
      {
        onSuccess: () => {
          setProfileId('');
          setShowAddForm(false);
        },
        onError: (err: any) => {
          Alert.alert(t('common.error'), err?.message ?? t('common.unexpectedError'));
        },
      },
    );
  };

  const handleRemove = (roleId: string) => {
    Alert.alert(t('programs.confirm.removeRole'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('programs.actions.removeRole'),
        style: 'destructive',
        onPress: () => removeRole.mutate(roleId),
      },
    ]);
  };

  const roleVariant = (role: ProgramRoleType) => {
    switch (role) {
      case 'teacher':
        return 'info' as const;
      case 'supervisor':
        return 'violet' as const;
      case 'program_admin':
        return 'indigo' as const;
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.labels.team')}</Text>
          <Button
            title={t('common.add')}
            onPress={() => setShowAddForm(!showAddForm)}
            variant="primary"
            size="sm"
          />
        </View>

        {showAddForm && (
          <Card variant="outlined" style={styles.form}>
            <TextField
              label={t('programs.labels.selectTeacher')}
              value={profileId}
              onChangeText={setProfileId}
              placeholder="Profile UUID"
            />
            <View style={styles.roleButtons}>
              {(['teacher', 'supervisor', 'program_admin'] as ProgramRoleType[]).map((role) => (
                <Button
                  key={role}
                  title={t(`programs.roles.${role}`)}
                  onPress={() => setSelectedRole(role)}
                  variant={selectedRole === role ? 'primary' : 'default'}
                  size="sm"
                />
              ))}
            </View>
            <Button
              title={t('programs.actions.assignRole')}
              onPress={handleAssign}
              variant="primary"
              loading={assignRole.isPending}
            />
          </Card>
        )}

        {roles.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('programs.empty.team')}
            description={t('programs.empty.teamDesc')}
          />
        ) : (
          <FlashList
            data={roles}
            keyExtractor={(item) => item.id}
            estimatedItemSize={70}
            renderItem={({ item }: { item: ProgramRoleWithProfile }) => (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {item.profiles?.full_name ?? '—'}
                    </Text>
                    <Badge
                      label={t(`programs.roles.${item.role}`)}
                      variant={roleVariant(item.role)}
                      size="sm"
                    />
                  </View>
                  <Button
                    title={t('programs.actions.removeRole')}
                    onPress={() => handleRemove(item.id)}
                    variant="danger"
                    size="sm"
                    loading={removeRole.isPending}
                  />
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    padding: spacing.base,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
  },
});
