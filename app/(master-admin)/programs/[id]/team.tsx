import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, PageHeader } from '@/components/layout';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import { TeamMemberRow } from '@/features/admin/components/TeamMemberRow';
import { UserSearchSheet } from '@/features/admin/components/UserSearchSheet';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import type { ProgramRoleType } from '@/features/programs/types/programs.types';

const TEAM_ROLES: ProgramRoleType[] = ['program_admin', 'supervisor', 'teacher'];

export default function ProgramTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const teamQuery = useProgramTeam(id);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  const handleAssign = () => {
    if (!selectedUser || !id || !session?.user?.id) return;
    teamQuery.assign.mutate(
      { input: { profileId: selectedUser.id, programId: id, role: selectedRole }, assignedBy: session.user.id },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.assignSuccess'));
          setSelectedUser(null);
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.assignError'));
        },
      },
    );
  };

  const handleRemove = (roleId: string, memberName: string) => {
    Alert.alert(
      t('admin.masterAdmin.users.roles.removeConfirm', { role: '', program: memberName }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            teamQuery.remove.mutate(roleId, {
              onSuccess: () => Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.removeSuccess')),
              onError: () => Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.removeError')),
            });
          },
        },
      ],
    );
  };

  if (teamQuery.isLoading) return <LoadingState />;
  if (teamQuery.error) return <ErrorState onRetry={teamQuery.refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader
          title={t('admin.masterAdmin.programs.team')}
          rightAction={
            <Pressable
              onPress={() => setShowUserSearch(true)}
              hitSlop={8}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary[500]} />
            </Pressable>
          }
        />

        {selectedUser && (
          <View style={styles.assignSection}>
            <View style={styles.selectedUser}>
              <Text style={styles.selectedName}>{selectedUser.full_name}</Text>
              <Pressable onPress={() => setSelectedUser(null)}>
                <Text style={styles.changeText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.roleRow}>
              {TEAM_ROLES.map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                    {role.replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title={t('common.confirm')}
              onPress={handleAssign}
              loading={teamQuery.assign.isPending}
              disabled={teamQuery.assign.isPending}
              size="sm"
            />
          </View>
        )}

        {teamQuery.data && teamQuery.data.length > 0 ? (
          teamQuery.data.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              onRemove={() => handleRemove(member.id, member.profiles?.full_name ?? '')}
            />
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title={t('admin.masterAdmin.programs.noTeam')}
          />
        )}

        <UserSearchSheet
          isOpen={showUserSearch && !selectedUser}
          onClose={() => setShowUserSearch(false)}
          onSelect={(user) => {
            setSelectedUser({ id: user.id, full_name: user.full_name });
            setShowUserSearch(false);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  addButton: {
    width: normalize(38),
    height: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignSection: {
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.base,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  changeText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
});
