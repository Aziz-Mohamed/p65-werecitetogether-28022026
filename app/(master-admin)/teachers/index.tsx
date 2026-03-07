import React, { useState } from 'react';
import { StyleSheet, View, Text, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Admin Teachers List ──────────────────────────────────────────────────────

export default function AdminTeachersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { resolveName } = useLocalizedName();
  const { data: teachers = [], isLoading, error, refetch } = useTeachers({
    searchQuery: searchQuery || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Text style={styles.title}>{t('admin.teachers.title')}</Text>
          <Button
            title={t('admin.addTeacher')}
            onPress={() => router.push('/(master-admin)/teachers/create')}
            variant="primary"
            size="sm"
            icon={<Ionicons name="add" size={18} color={colors.white} />}
          />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={t('admin.teachers.searchPlaceholder')}
          style={styles.searchBar}
        />

        {teachers.length === 0 ? (
          <EmptyState
            icon="school-outline"
            title={t('admin.teachers.emptyTitle')}
            description={t('admin.teachers.emptyDescription')}
          />
        ) : (
          <FlashList
            data={teachers}
            keyExtractor={(item: any) => item.id}

            renderItem={({ item }: { item: any }) => (
              <Card
                variant="default"
                style={styles.card}
                onPress={() => router.push(`/(master-admin)/teachers/${item.id}`)}
              >
                <View style={styles.row}>
                  <Avatar
                    source={item.avatar_url ?? undefined}
                    name={resolveName(item.name_localized, item.full_name)}
                    size="md"
                  />
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {resolveName(item.name_localized, item.full_name)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.username ? `@${item.username}` : ''}
                      {(item.classes?.length ?? 0) > 0
                        ? ` · ${item.classes.length} ${t('admin.teachers.classes')}`
                        : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={18}
                    color={colors.neutral[300]}
                  />
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: normalize(2),
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  meta: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
