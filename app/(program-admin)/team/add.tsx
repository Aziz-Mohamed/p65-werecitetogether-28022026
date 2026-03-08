import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

import { UserSearchSheet, type UserSearchResult } from '@/features/admin/components/UserSearchSheet';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import type { ProgramRoleType } from '@/features/programs/types/programs.types';

const ROLES: ProgramRoleType[] = ['teacher', 'supervisor'];

const ROLE_ICONS: Record<string, string> = {
  teacher: 'school-outline',
  supervisor: 'eye-outline',
};

export default function AddTeamMember() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const team = useProgramTeam(programId);

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
    setTimeout(() => roleSheetRef.current?.present(), 300);
  }, []);

  const handleAssign = useCallback(() => {
    if (!selectedUser || !programId || !session?.user?.id) return;

    team.assign.mutate(
      {
        input: { profileId: selectedUser.id, programId, role: selectedRole },
        assignedBy: session.user.id,
      },
      {
        onSuccess: () => {
          roleSheetRef.current?.dismiss();
          Alert.alert(t('common.success'), t('admin.programAdmin.team.assignSuccess'));
          router.back();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.programAdmin.team.assignError'));
        },
      },
    );
  }, [selectedUser, programId, session?.user?.id, selectedRole, team.assign, t, router]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheetModalProvider>
      <Screen>
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>

          <Text style={styles.title}>{t('admin.programAdmin.team.addMember')}</Text>

          <Button
            title={t('admin.programAdmin.team.searchUsers')}
            variant="secondary"
            onPress={handleOpenSearch}
            icon={<Ionicons name="search-outline" size={18} color={colors.secondary[700]} />}
            style={styles.searchButton}
          />
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
            <View style={styles.userInfo}>
              <Avatar
                name={selectedUser.full_name}
                source={selectedUser.avatar_url ?? undefined}
                size="lg"
              />
              <Text style={styles.userName}>{selectedUser.full_name}</Text>
              <Text style={styles.userRole}>{selectedUser.role.replace('_', ' ')}</Text>
            </View>

            <Text style={styles.sectionLabel}>
              {t('admin.programAdmin.team.rolePicker')}
            </Text>
            <View style={styles.roleGrid}>
              {ROLES.map((role) => {
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

            <Button
              title={t('admin.programAdmin.team.addMember')}
              onPress={handleAssign}
              loading={team.assign.isPending}
              disabled={team.assign.isPending}
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
  searchButton: {
    marginHorizontal: spacing.base,
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
