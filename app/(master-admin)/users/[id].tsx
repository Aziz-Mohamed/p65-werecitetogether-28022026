import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useUserDetail } from '@/features/admin/hooks/useUserDetail';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { RoleAssignmentSheet } from '@/features/admin/components/RoleAssignmentSheet';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resolveName } = useLocalizedName();
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  const { data: user, isLoading, error, refetch } = useUserDetail(id);

  // Also fetch program roles via the admin users search (for RoleAssignmentSheet)
  const adminUsers = useAdminUsers(id ?? '');
  const adminUser = adminUsers.data?.find((u) => u.id === id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!user) return <ErrorState description={t('common.noResults')} />;

  const programRoles = adminUser?.program_roles_data ?? [];

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader title={t('admin.masterAdmin.users.detail.title')} />

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            source={user.avatar_url ?? undefined}
            name={resolveName(user.name_localized, user.full_name)}
            size="lg"
          />
          <Text style={styles.name}>{resolveName(user.name_localized, user.full_name)}</Text>
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
          <Badge label={user.role} variant="info" size="md" />
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionLabel}>{t('admin.detail.personalInfo')}</Text>
        <Card variant="default" style={styles.infoCard}>
          {user.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.phone')}</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          {user.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.joined')}</Text>
              <Text style={styles.infoValue}>
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Program Roles */}
        <Text style={styles.sectionLabel}>{t('admin.detail.programRoles')}</Text>
        {programRoles.length > 0 ? (
          <Card variant="default" style={styles.infoCard}>
            {programRoles.map((pr, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoLabel} numberOfLines={1}>{pr.program_name}</Text>
                <Badge label={pr.role.replace('_', ' ')} variant="default" size="sm" />
              </View>
            ))}
          </Card>
        ) : (
          <Card variant="default" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('admin.detail.noPrograms')}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('admin.masterAdmin.users.detail.manageRoles')}
            onPress={() => setShowRoleSheet(true)}
            style={styles.actionButton}
          />
        </View>

        {showRoleSheet && adminUser && (
          <RoleAssignmentSheet
            isOpen={showRoleSheet}
            onClose={() => setShowRoleSheet(false)}
            user={adminUser}
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
  profileHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  username: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
