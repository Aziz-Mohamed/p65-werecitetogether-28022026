import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useUserDetail } from '@/features/admin/hooks/useUserDetail';
import { RoleAssignmentSheet } from '@/features/admin/components/RoleAssignmentSheet';
import type { AdminUser } from '@/features/admin/types/admin.types';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

type BadgeVariant = 'info' | 'violet' | 'indigo' | 'rose' | 'default';

function getRoleBadgeVariant(role: string): BadgeVariant {
  switch (role) {
    case 'teacher': return 'info';
    case 'supervisor': return 'violet';
    case 'program_admin': return 'indigo';
    case 'master_admin': return 'rose';
    default: return 'default';
  }
}

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const { id, email: emailParam } = useLocalSearchParams<{ id: string; email?: string }>();
  const { resolveName } = useLocalizedName();
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  const { data: user, isLoading, error, refetch } = useUserDetail(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!user) return <ErrorState description={t('common.noResults')} />;

  const displayName = resolveName(user.name_localized, user.full_name);
  const programRoles = user.program_roles_data ?? [];
  const email = emailParam ?? '';

  const adminUser: AdminUser = {
    id: user.id,
    full_name: user.full_name,
    email,
    role: user.role,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    program_roles_data: programRoles,
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader title={t('admin.masterAdmin.users.detail.title')} />

        {/* Profile Header */}
        <Card variant="elevated" style={styles.profileCard}>
          <Avatar
            source={user.avatar_url ?? undefined}
            name={displayName}
            size="xl"
          />
          <Text style={styles.name}>{displayName}</Text>
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
          {email ? <Text style={styles.email}>{email}</Text> : null}
          <Badge label={user.role.replace('_', ' ')} variant={getRoleBadgeVariant(user.role)} size="md" />
        </Card>

        {/* Personal Information */}
        <Text style={styles.sectionLabel}>{t('admin.detail.personalInfo')}</Text>
        <Card variant="default" style={styles.infoCard}>
          {user.created_at && (
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent.sky[50] }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent.sky[500]} />
              </View>
              <Text style={styles.infoLabel}>{t('admin.detail.joined')}</Text>
              <Text style={styles.infoValue}>
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
          {user.phone && user.created_at && <View style={styles.divider} />}
          {user.phone && (
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="call-outline" size={16} color={colors.primary[500]} />
              </View>
              <Text style={styles.infoLabel}>{t('admin.detail.phone')}</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          {email ? (
            <>
              {(user.phone || user.created_at) && <View style={styles.divider} />}
              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: colors.accent.indigo[50] }]}>
                  <Ionicons name="mail-outline" size={16} color={colors.accent.indigo[500]} />
                </View>
                <Text style={styles.infoLabel}>{t('admin.detail.email')}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
              </View>
            </>
          ) : null}
        </Card>

        {/* Programs & Roles */}
        <Text style={styles.sectionLabel}>
          {t('admin.detail.programRoles')}
          {programRoles.length > 0 && (
            <Text style={styles.sectionCount}> ({programRoles.length})</Text>
          )}
        </Text>
        <Card variant="default" style={styles.infoCard}>
          {programRoles.length > 0 ? (
            programRoles.map((pr, i) => (
              <View key={pr.role_id}>
                <View style={styles.roleRow}>
                  <Text style={styles.roleProgramName} numberOfLines={1}>
                    {pr.program_name}
                  </Text>
                  <Badge
                    label={pr.role.replace('_', ' ')}
                    variant={getRoleBadgeVariant(pr.role)}
                    size="sm"
                  />
                </View>
                {i < programRoles.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={28} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>{t('admin.detail.noPrograms')}</Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <Button
          title={t('admin.masterAdmin.users.detail.manageRoles')}
          onPress={() => setShowRoleSheet(true)}
          variant="indigo"
          icon={<Ionicons name="settings-outline" size={18} color={colors.white} />}
        />

        {showRoleSheet && (
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
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  username: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  email: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  sectionCount: {
    ...typography.textStyles.label,
    color: colors.neutral[400],
    textTransform: 'none',
  },
  infoCard: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: lightTheme.border,
    marginVertical: spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  roleProgramName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
