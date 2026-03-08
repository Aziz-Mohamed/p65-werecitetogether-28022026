import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, RefreshControl, ActionSheetIOS, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import type { AdminUser } from '@/features/admin/types/admin.types';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

const ROLE_OPTIONS = ['all', 'student', 'teacher', 'supervisor', 'program_admin', 'master_admin'] as const;

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

export default function UserListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const users = useAdminUsers(debouncedQuery);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text.trim()), 300);
  }, []);

  const roleLabels = useMemo(() => ({
    all: t('common.all'),
    student: t('roles.student'),
    teacher: t('roles.teacher'),
    supervisor: t('roles.supervisor'),
    program_admin: t('roles.program_admin'),
    master_admin: t('roles.master_admin'),
  }), [t]);

  const filteredUsers = useMemo(() => {
    if (!users.data) return [];
    if (roleFilter === 'all') return users.data;
    return users.data.filter((u) => u.role === roleFilter);
  }, [users.data, roleFilter]);

  const openRolePicker = () => {
    const options = ROLE_OPTIONS.map((r) => roleLabels[r]);
    const cancelLabel = t('common.cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, cancelLabel], cancelButtonIndex: options.length },
        (index) => { if (index < options.length) setRoleFilter(ROLE_OPTIONS[index]); },
      );
    } else {
      const currentIndex = ROLE_OPTIONS.indexOf(roleFilter as typeof ROLE_OPTIONS[number]);
      const nextIndex = (currentIndex + 1) % ROLE_OPTIONS.length;
      setRoleFilter(ROLE_OPTIONS[nextIndex]);
    }
  };

  const renderUserRow = useCallback(({ item }: { item: AdminUser }) => {
    const programCount = item.program_roles_data?.length ?? 0;

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: '/(master-admin)/users/[id]',
            params: { id: item.id, email: item.email },
          })
        }
        accessibilityRole="button"
      >
        <Avatar
          source={item.avatar_url ?? undefined}
          name={item.full_name}
          size="md"
        />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
            <Badge
              label={item.role.replace('_', ' ')}
              variant={getRoleBadgeVariant(item.role)}
              size="sm"
            />
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
            {programCount > 0 && (
              <View style={styles.programCountContainer}>
                <Ionicons name="layers-outline" size={12} color={colors.neutral[400]} />
                <Text style={styles.programCountText}>
                  {t('admin.masterAdmin.users.roles.programCount', { count: programCount })}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
      </Pressable>
    );
  }, [router, t]);

  return (
    <Screen>
      <View style={styles.container}>
        <PageHeader title={t('admin.masterAdmin.users.title')} />

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.neutral[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('admin.masterAdmin.users.searchPlaceholder')}
              placeholderTextColor={lightTheme.textSecondary}
              value={query}
              onChangeText={handleSearch}
            />
          </View>
          <Pressable style={[styles.filterButton, roleFilter !== 'all' && styles.filterButtonActive]} onPress={openRolePicker}>
            <Ionicons name="filter-outline" size={normalize(16)} color={roleFilter !== 'all' ? colors.primary[500] : lightTheme.textSecondary} />
            <Text style={[styles.filterText, roleFilter !== 'all' && styles.filterTextActive]} numberOfLines={1}>
              {roleLabels[roleFilter as keyof typeof roleLabels]}
            </Text>
            <Ionicons name="chevron-down" size={normalize(12)} color={roleFilter !== 'all' ? colors.primary[500] : lightTheme.textSecondary} />
          </Pressable>
        </View>

        <FlashList
          data={filteredUsers}
          estimatedItemSize={72}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={users.isRefetching} onRefresh={() => users.refetch()} />
          }
          renderItem={renderUserRow}
          ListEmptyComponent={
            !users.isLoading && (debouncedQuery.length === 0 || debouncedQuery.length >= 2) ? (
              users.isError ? (
                <ErrorState onRetry={() => users.refetch()} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={40} color={colors.neutral[300]} />
                  <Text style={styles.emptyText}>{t('common.noResults')}</Text>
                </View>
              )
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  searchRow: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: radius.md,
    backgroundColor: lightTheme.surface,
    height: normalize(44),
  },
  searchIcon: {
    marginLeft: spacing.md,
  },
  searchInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    height: normalize(44),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: lightTheme.border,
    backgroundColor: lightTheme.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  filterText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  filterTextActive: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.medium,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  rowContent: {
    flex: 1,
    gap: normalize(4),
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  rowEmail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    flex: 1,
  },
  programCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(3),
  },
  programCountText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    fontSize: typography.fontSize.xs,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
