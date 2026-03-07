import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, RefreshControl, ActionSheetIOS, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

const ROLE_OPTIONS = ['all', 'student', 'teacher', 'supervisor', 'program_admin', 'master_admin'] as const;

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
      // Android: cycle through roles on tap as simple fallback
      const currentIndex = ROLE_OPTIONS.indexOf(roleFilter as typeof ROLE_OPTIONS[number]);
      const nextIndex = (currentIndex + 1) % ROLE_OPTIONS.length;
      setRoleFilter(ROLE_OPTIONS[nextIndex]);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('admin.masterAdmin.users.title')}</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('admin.masterAdmin.users.searchPlaceholder')}
              placeholderTextColor={lightTheme.textSecondary}
              value={query}
              onChangeText={handleSearch}
            />
          </View>
          <Pressable style={styles.filterButton} onPress={openRolePicker}>
            <Ionicons name="filter-outline" size={normalize(18)} color={roleFilter !== 'all' ? colors.primary[500] : lightTheme.textSecondary} />
            <Text style={[styles.filterText, roleFilter !== 'all' && styles.filterTextActive]} numberOfLines={1}>
              {roleLabels[roleFilter as keyof typeof roleLabels]}
            </Text>
            <Ionicons name="chevron-down" size={normalize(14)} color={lightTheme.textSecondary} />
          </Pressable>
        </View>

        <FlashList
          data={filteredUsers}
          estimatedItemSize={64}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={users.isRefetching} onRefresh={() => users.refetch()} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: '/(master-admin)/users/[id]',
                  params: { id: item.id },
                })
              }
              accessibilityRole="button"
            >
              <Avatar
                source={item.avatar_url ?? undefined}
                name={item.full_name}
                size="sm"
              />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>{item.full_name}</Text>
                <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
              </View>
              <Badge label={item.role} variant="default" size="sm" />
            </Pressable>
          )}
          ListEmptyComponent={
            !users.isLoading && (debouncedQuery.length === 0 || debouncedQuery.length >= 2) ? (
              users.isError ? (
                <ErrorState onRetry={() => users.refetch()} />
              ) : (
                <View style={styles.emptyContainer}>
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
    marginBottom: spacing.base,
  },
  searchRow: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {},
  searchInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
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
  filterText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  filterTextActive: {
    color: colors.primary[500],
    fontFamily: typography.fontFamily.medium,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  rowEmail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
