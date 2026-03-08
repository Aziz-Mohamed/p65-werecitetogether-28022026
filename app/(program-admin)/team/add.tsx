import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';

import { UserSearchSheet } from '@/features/admin/components/UserSearchSheet';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import type { ProgramRoleType } from '@/features/programs/types/programs.types';

const ROLES: ProgramRoleType[] = ['teacher', 'supervisor'];

export default function AddTeamMember() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const team = useProgramTeam(programId);

  const searchSheetRef = useRef<BottomSheetModal>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  const handleOpenSearch = useCallback(() => {
    searchSheetRef.current?.present();
  }, []);

  const handleAssign = () => {
    if (!selectedUser || !programId || !session?.user?.id) return;

    team.assign.mutate(
      {
        input: { profileId: selectedUser.id, programId, role: selectedRole },
        assignedBy: session.user.id,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.programAdmin.team.assignSuccess'));
          router.back();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.programAdmin.team.assignError'));
        },
      },
    );
  };

  return (
    <BottomSheetModalProvider>
      <Screen>
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>

          <Text style={styles.title}>{t('admin.programAdmin.team.addMember')}</Text>

          {selectedUser ? (
            <View style={styles.selectedUser}>
              <Text style={styles.selectedName}>{selectedUser.full_name}</Text>
              <Pressable onPress={() => { setSelectedUser(null); handleOpenSearch(); }}>
                <Text style={styles.changeText}>{t('common.edit')}</Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title={t('common.search')}
              variant="secondary"
              onPress={handleOpenSearch}
              style={styles.searchButton}
            />
          )}

          <Text style={styles.sectionLabel}>{t('admin.programAdmin.team.rolePicker')}</Text>
          <View style={styles.roleRow}>
            {ROLES.map((role) => (
              <Pressable
                key={role}
                style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                onPress={() => setSelectedRole(role)}
                accessibilityRole="button"
              >
                <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                  {role.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title={t('admin.programAdmin.team.addMember')}
            onPress={handleAssign}
            disabled={!selectedUser || team.assign.isPending}
            loading={team.assign.isPending}
            style={styles.assignButton}
          />
        </View>
      </Screen>

      <UserSearchSheet
        ref={searchSheetRef}
        onSelect={(user) => {
          setSelectedUser({ id: user.id, full_name: user.full_name });
        }}
      />
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[500],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.base,
    backgroundColor: lightTheme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
    marginBottom: spacing.base,
  },
  selectedName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  changeText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
  },
  searchButton: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  roleChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  roleChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  roleChipText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  roleChipTextActive: {
    color: colors.primary[700],
  },
  assignButton: {
    marginHorizontal: spacing.base,
  },
});
