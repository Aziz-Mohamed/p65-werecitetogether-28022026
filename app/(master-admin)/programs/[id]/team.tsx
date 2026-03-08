import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import { TeamMemberRow } from '@/features/admin/components/TeamMemberRow';
import { UserSearchSheet, type UserSearchResult } from '@/features/admin/components/UserSearchSheet';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import type { ProgramRoleType } from '@/features/programs/types/programs.types';

const TEAM_ROLES: ProgramRoleType[] = ['program_admin', 'supervisor', 'teacher'];

const ROLE_ICONS: Record<ProgramRoleType, string> = {
  program_admin: 'shield-outline',
  supervisor: 'eye-outline',
  teacher: 'school-outline',
};

export default function ProgramTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const teamQuery = useProgramTeam(id);

  const searchSheetRef = useRef<BottomSheetModal>(null);
  const roleSheetRef = useRef<BottomSheetModal>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  const roleSnapPoints = useMemo(() => ['45%'], []);

  const handleOpenSearch = useCallback(() => {
    searchSheetRef.current?.present();
  }, []);

  const handleUserSelected = useCallback((user: UserSearchResult) => {
    setSelectedUser(user);
    setSelectedRole('teacher');
    // Small delay to let the search sheet dismiss before presenting the role sheet
    setTimeout(() => roleSheetRef.current?.present(), 300);
  }, []);

  const handleAssign = useCallback(() => {
    if (!selectedUser || !id || !session?.user?.id) return;
    teamQuery.assign.mutate(
      { input: { profileId: selectedUser.id, programId: id, role: selectedRole }, assignedBy: session.user.id },
      {
        onSuccess: () => {
          roleSheetRef.current?.dismiss();
          setSelectedUser(null);
          Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.assignSuccess'));
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.assignError'));
        },
      },
    );
  }, [selectedUser, id, session?.user?.id, selectedRole, teamQuery.assign, t]);

  const handleRemove = useCallback((roleId: string, memberName: string) => {
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
  }, [teamQuery.remove, t]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  if (teamQuery.isLoading) return <LoadingState />;
  if (teamQuery.error) return <ErrorState onRetry={teamQuery.refetch} />;

  return (
    <BottomSheetModalProvider>
      <Screen scroll>
        <View style={styles.container}>
          <PageHeader
            title={t('admin.masterAdmin.programs.team')}
            rightAction={
              <Pressable
                onPress={handleOpenSearch}
                hitSlop={8}
                style={styles.addButton}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary[500]} />
              </Pressable>
            }
          />

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
        </View>
      </Screen>

      <UserSearchSheet
        ref={searchSheetRef}
        onSelect={handleUserSelected}
      />

      {/* ── Role Picker Sheet ── */}
      <BottomSheetModal
        ref={roleSheetRef}
        snapPoints={roleSnapPoints}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        onDismiss={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <View style={styles.roleSheetContent}>
            {/* User info */}
            <View style={styles.userInfo}>
              <Avatar
                name={selectedUser.full_name}
                source={selectedUser.avatar_url ?? undefined}
                size="lg"
              />
              <Text style={styles.userName}>{selectedUser.full_name}</Text>
              <Text style={styles.userRole}>{selectedUser.role.replace('_', ' ')}</Text>
            </View>

            {/* Role picker */}
            <Text style={styles.sectionLabel}>
              {t('admin.masterAdmin.users.roles.selectRole')}
            </Text>
            <View style={styles.roleGrid}>
              {TEAM_ROLES.map((role) => {
                const isActive = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    style={[styles.roleCard, isActive && styles.roleCardActive]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Ionicons
                      name={ROLE_ICONS[role] as any}
                      size={20}
                      color={isActive ? colors.primary[600] : colors.neutral[400]}
                    />
                    <Text style={[styles.roleCardText, isActive && styles.roleCardTextActive]}>
                      {role.replace('_', ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Confirm */}
            <Button
              title={t('admin.masterAdmin.users.roles.assignProgram')}
              onPress={handleAssign}
              loading={teamQuery.assign.isPending}
              disabled={teamQuery.assign.isPending}
              variant="primary"
              size="lg"
            />
          </View>
        )}
      </BottomSheetModal>
    </BottomSheetModalProvider>
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

  // ── Role Picker Sheet ──
  sheetBackground: {
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
  },
  handleIndicator: {
    backgroundColor: colors.neutral[300],
    width: normalize(36),
    height: normalize(4),
  },
  roleSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  userInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.xs,
  },
  userRole: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    lineHeight: normalize(18),
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  roleCardActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  roleCardText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    lineHeight: normalize(16),
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
  roleCardTextActive: {
    color: colors.primary[700],
  },
});
