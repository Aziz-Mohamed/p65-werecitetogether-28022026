import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { RoleSelector } from '@/features/auth/components/RoleSelector';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { UserRole } from '@/types/common.types';

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'supervisor', 'program_admin', 'master_admin'];

export default function EditRoleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { role: callerRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const allowedRoles = ALL_ROLES;

  // Fetch target user's profile
  const { data: targetProfile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      const result = await authService.getProfile(userId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!userId,
  });

  // Set initial selected role from target profile
  React.useEffect(() => {
    if (targetProfile && !selectedRole) {
      setSelectedRole(targetProfile.role as UserRole);
    }
  }, [targetProfile, selectedRole]);

  const handleUpdateRole = async () => {
    if (!userId || !selectedRole) return;

    setIsUpdating(true);
    try {
      const result = await authService.updateRole({
        action: 'update-role',
        userId,
        role: selectedRole,
      });

      if (result.error) {
        Alert.alert(t('common.error'), result.error.message);
        return;
      }

      Alert.alert(t('common.success'), t('common.done'), [
        { text: t('common.done'), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.unexpectedError'),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <PageHeader title={t('admin.masterAdmin.users.detail.manageRoles')} />

        {targetProfile && (
          <Text style={styles.userName}>{targetProfile.full_name}</Text>
        )}

        <RoleSelector
          value={selectedRole}
          onChange={setSelectedRole}
          allowedRoles={allowedRoles}
        />

        <Button
          title={t('common.save')}
          onPress={handleUpdateRole}
          disabled={isUpdating || !selectedRole || selectedRole === targetProfile?.role}
          loading={isUpdating}
          fullWidth
          style={styles.saveButton}
        />

        <Button
          title={t('common.cancel')}
          onPress={() => router.back()}
          disabled={isUpdating}
          fullWidth
          style={styles.cancelButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBlockStart: spacing.xl,
    paddingInline: spacing.base,
  },
  userName: {
    ...typography.textStyles.subheading,
    color: lightTheme.textSecondary,
    marginBlockEnd: spacing.md,
  },
  loadingText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBlockStart: spacing.xl,
  },
  saveButton: {
    marginBlockStart: spacing.md,
  },
  cancelButton: {
    marginBlockStart: spacing.sm,
  },
});
