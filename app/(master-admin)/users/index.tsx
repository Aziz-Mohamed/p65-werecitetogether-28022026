import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui';
import { SearchBar } from '@/components/ui/SearchBar';
import { useSearchProfiles } from '@/features/programs/hooks/useRoleManagement';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function UserListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading } = useSearchProfiles(searchQuery);
  const handleClear = useCallback(() => setSearchQuery(''), []);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={lightTheme.text} />
          </Pressable>
          <Text style={styles.title}>
            {t('dashboard.masterAdmin.users')}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClear}
            placeholder={t('common.search')}
          />
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              variant="default"
              onPress={() => router.push(`/(master-admin)/users/${item.id}`)}
              style={styles.userCard}
            >
              <View style={styles.userRow}>
                <Avatar
                  source={item.avatar_url ?? undefined}
                  name={item.full_name}
                  size="md"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.display_name ?? item.full_name}
                  </Text>
                  <Text style={styles.userRole}>
                    {t(`roles.${item.role}`)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={neutral[300]}
                />
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            searchQuery.length >= 2 && !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={neutral[300]} />
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  searchContainer: {
    paddingInline: spacing.lg,
    marginBlockEnd: spacing.md,
  },
  list: {
    paddingInline: spacing.lg,
    paddingBlockEnd: spacing['2xl'],
  },
  separator: {
    height: spacing.sm,
  },
  userCard: {
    padding: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  userRole: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
