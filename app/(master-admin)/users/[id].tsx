import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { RoleAssignmentSheet } from '@/features/admin/components/RoleAssignmentSheet';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  // Re-search to get user data (or could pass via params)
  const users = useAdminUsers(id ?? '');
  const user = users.data?.find((u) => u.id === id);

  if (!user && !users.isLoading) {
    return (
      <Screen>
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
          <Text style={styles.emptyText}>{t('common.noResults')}</Text>
        </View>
      </Screen>
    );
  }

  if (!user) return null;

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <View style={styles.header}>
          <Avatar source={user.avatar_url ?? undefined} name={user.full_name} size="lg" />
          <View style={styles.headerText}>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.globalRole')}</Text>
        <Badge label={user.role} variant="info" />

        <Text style={styles.sectionLabel}>{t('admin.masterAdmin.users.detail.programRoles')}</Text>
        {user.program_roles_data.length > 0 ? (
          user.program_roles_data.map((pr, i) => (
            <View key={i} style={styles.roleRow}>
              <Text style={styles.roleProgram}>{pr.program_name}</Text>
              <Badge label={pr.role.replace('_', ' ')} variant="default" size="sm" />
            </View>
          ))
        ) : (
          <Text style={styles.noRoles}>{t('admin.masterAdmin.users.detail.noRoles')}</Text>
        )}

        <Button
          title={t('admin.masterAdmin.users.detail.manageRoles')}
          onPress={() => setShowRoleSheet(true)}
          style={styles.manageButton}
        />

        {showRoleSheet && (
          <RoleAssignmentSheet
            isOpen={showRoleSheet}
            onClose={() => setShowRoleSheet(false)}
            user={user}
          />
        )}
      </View>
    </Screen>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  email: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  roleProgram: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  noRoles: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    paddingHorizontal: spacing.base,
  },
  manageButton: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    padding: spacing['2xl'],
  },
});
