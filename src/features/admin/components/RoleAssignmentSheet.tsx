import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useManageRoles } from '../hooks/useManageRoles';
import type { AdminUser } from '../types/admin.types';

interface RoleAssignmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser;
}

export function RoleAssignmentSheet({ isOpen, onClose, user }: RoleAssignmentSheetProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);
  const roles = useManageRoles();

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

        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.globalRole')}</Text>
        <Badge label={user.role} variant="info" />

        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.programRoles')}</Text>
        {user.program_roles_data.length > 0 ? (
          user.program_roles_data.map((pr, i) => (
            <View key={i} style={styles.roleRow}>
              <Text style={styles.roleProgram}>{pr.program_name}</Text>
              <Badge label={pr.role.replace('_', ' ')} variant="default" size="sm" />
              <Pressable
                onPress={() => {
                  // Would need the role ID to remove; for now this is a UI placeholder
                  Alert.alert('TODO', 'Remove role requires role ID lookup');
                }}
                hitSlop={8}
              >
                <Text style={styles.removeText}>{t('common.remove')}</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.noRoles}>{t('admin.masterAdmin.users.detail.noRoles')}</Text>
        )}

        <View style={styles.actions}>
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
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
