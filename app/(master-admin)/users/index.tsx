import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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

export default function UserListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const users = useAdminUsers(debouncedQuery);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text.trim()), 300);
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('admin.masterAdmin.users.title')}</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.masterAdmin.users.searchPlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            value={query}
            onChangeText={handleSearch}
          />
        </View>

        <FlashList
          data={users.data ?? []}
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
            debouncedQuery.length >= 2 && !users.isLoading ? (
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
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
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
