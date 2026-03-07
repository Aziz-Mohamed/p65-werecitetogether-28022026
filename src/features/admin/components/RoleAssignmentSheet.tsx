import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { useManageRoles } from '../hooks/useManageRoles';
import { useAllPrograms } from '@/features/programs/hooks/useAdminPrograms';
import type { AdminUser } from '../types/admin.types';
import type { ProgramRoleType } from '@/features/programs/types/programs.types';

interface RoleAssignmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
}

const PROGRAM_ROLES: ProgramRoleType[] = ['program_admin', 'supervisor', 'teacher'];

export function RoleAssignmentSheet({ isOpen, onClose, user }: RoleAssignmentSheetProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const roles = useManageRoles();
  const { data: programs = [] } = useAllPrograms();

  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  // ─── Master Admin Promote / Demote ──────────────────────────────────────────

  const handlePromote = () => {
    Alert.alert(
      t('admin.masterAdmin.users.roles.promoteConfirm', { name: user.full_name }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            roles.assignMasterAdmin.mutate(
              { userId: user.id, assignedBy: session?.user?.id ?? '' },
              {
                onSuccess: () => {
                  Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.promoteSuccess'));
                  onClose();
                },
                onError: (err) => {
                  const msg = (err as { message?: string })?.message ?? '';
                  if (msg.includes('already')) {
                    Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.alreadyAdmin'));
                  } else {
                    Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.promoteError'));
                  }
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleDemote = () => {
    Alert.alert(
      t('admin.masterAdmin.users.roles.demoteConfirm', { name: user.full_name }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            roles.revokeMasterAdmin.mutate(user.id, {
              onSuccess: () => {
                Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.demoteSuccess'));
                onClose();
              },
              onError: (err) => {
                const msg = (err as { message?: string })?.message ?? '';
                if (msg.includes('last')) {
                  Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.lastAdminError'));
                } else {
                  Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.demoteError'));
                }
              },
            });
          },
        },
      ],
    );
  };

  // ─── Program Role Remove ────────────────────────────────────────────────────

  const handleRemoveProgramRole = (roleId: string, programName: string, roleName: string) => {
    Alert.alert(
      t('admin.masterAdmin.users.roles.removeConfirm', { role: roleName, program: programName }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            roles.removeProgramRole.mutate(roleId, {
              onSuccess: () => {
                Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.removeSuccess'));
                onClose();
              },
              onError: () => {
                Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.removeError'));
              },
            });
          },
        },
      ],
    );
  };

  // ─── Program Role Assign ────────────────────────────────────────────────────

  const handleAssignProgramRole = () => {
    if (!selectedProgramId || !session?.user?.id) return;

    roles.assignProgramRole.mutate(
      {
        input: { profileId: user.id, programId: selectedProgramId, role: selectedRole },
        assignedBy: session.user.id,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.assignSuccess'));
          setIsAssigning(false);
          setSelectedProgramId(null);
          onClose();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.assignError'));
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('admin.masterAdmin.users.detail.manageRoles')}</Text>
        <Text style={styles.userName}>{user.full_name}</Text>

        {/* ── Global Role ── */}
        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.globalRole')}</Text>
        <Badge label={user.role} variant="info" />

        {/* ── Existing Program Roles ── */}
        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.programRoles')}</Text>
        {user.program_roles_data.length > 0 ? (
          user.program_roles_data.map((pr, i) => (
            <View key={i} style={styles.roleRow}>
              <Text style={styles.roleProgram}>{pr.program_name}</Text>
              <Badge label={pr.role.replace('_', ' ')} variant="default" size="sm" />
              <Pressable
                onPress={() => handleRemoveProgramRole(pr.role_id, pr.program_name, pr.role)}
                hitSlop={8}
              >
                <Text style={styles.removeText}>{t('common.remove')}</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.noRoles}>{t('admin.masterAdmin.users.detail.noRoles')}</Text>
        )}

        {/* ── Assign Program Role ── */}
        {!isAssigning ? (
          <Button
            title={t('admin.masterAdmin.users.roles.assignProgram')}
            onPress={() => setIsAssigning(true)}
            variant="secondary"
            style={styles.assignButton}
          />
        ) : (
          <View style={styles.assignSection}>
            <Text style={styles.assignLabel}>{t('admin.masterAdmin.users.roles.selectProgram')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {programs.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.chip, selectedProgramId === p.id && styles.chipActive]}
                    onPress={() => setSelectedProgramId(p.id)}
                  >
                    <Text style={[styles.chipText, selectedProgramId === p.id && styles.chipTextActive]} numberOfLines={1}>
                      {p.name_ar || p.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.assignLabel}>{t('admin.masterAdmin.users.roles.selectRole')}</Text>
            <View style={styles.chipRow}>
              {PROGRAM_ROLES.map((role) => (
                <Pressable
                  key={role}
                  style={[styles.chip, selectedRole === role && styles.chipActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.chipText, selectedRole === role && styles.chipTextActive]}>
                    {role.replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.assignActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => { setIsAssigning(false); setSelectedProgramId(null); }}
                variant="ghost"
                size="sm"
              />
              <Button
                title={t('common.confirm')}
                onPress={handleAssignProgramRole}
                disabled={!selectedProgramId || roles.assignProgramRole.isPending}
                loading={roles.assignProgramRole.isPending}
                size="sm"
              />
            </View>
          </View>
        )}

        {/* ── Master Admin Promote / Demote ── */}
        <View style={styles.masterAdminSection}>
          {user.role !== 'master_admin' ? (
            <Button
              title={t('admin.masterAdmin.users.roles.promoteMasterAdmin')}
              onPress={handlePromote}
              loading={roles.assignMasterAdmin.isPending}
            />
          ) : (
            <Button
              title={t('admin.masterAdmin.users.roles.demoteMasterAdmin')}
              onPress={handleDemote}
              variant="danger"
              loading={roles.revokeMasterAdmin.isPending}
            />
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBottom: spacing.base,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  roleProgram: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  removeText: {
    ...typography.textStyles.caption,
    color: lightTheme.error,
  },
  noRoles: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  assignButton: {
    marginTop: spacing.base,
  },
  assignSection: {
    marginTop: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.base,
  },
  assignLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    textTransform: 'uppercase',
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
    backgroundColor: lightTheme.surface,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  chipText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
    fontSize: typography.fontSize.sm,
  },
  chipTextActive: {
    color: colors.primary[700],
  },
  assignActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  masterAdminSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
