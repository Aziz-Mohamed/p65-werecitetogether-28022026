import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { SearchBar } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Admin Classes List ───────────────────────────────────────────────────────

export default function AdminClassesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { resolveName } = useLocalizedName();
  const { data: classes = [], isLoading, error, refetch } = useClasses({
    searchQuery: searchQuery || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={lightTheme.text}
            />
          </Pressable>
          <Text style={styles.title}>{t('admin.classes.title')}</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/(master-admin)/classes/create')}
            hitSlop={8}
          >
            <Ionicons name="add" size={24} color={lightTheme.text} />
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={t('admin.classes.searchPlaceholder')}
          style={styles.searchBar}
        />

        {classes.length === 0 ? (
          <EmptyState
            icon="albums-outline"
            title={t('admin.classes.emptyTitle')}
            description={t('admin.classes.emptyDescription')}
          />
        ) : (
          <FlashList
            data={classes}
            keyExtractor={(item: any) => item.id}

            renderItem={({ item }: { item: any }) => (
              <Card
                variant="outlined"
                style={styles.classCard}
                onPress={() => router.push(`/(master-admin)/classes/${item.id}`)}
              >
                <View style={styles.classRow}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{resolveName(item.name_localized, item.name)}</Text>
                    <Text style={styles.classMeta}>
                      {item.profiles?.full_name
                        ? `${t('admin.classes.teacher')}: ${resolveName(item.profiles?.name_localized, item.profiles?.full_name)}`
                        : t('admin.classes.noTeacher')}
                      {` · ${item.students?.length ?? 0} ${t('admin.classes.students')}`}
                    </Text>
                  </View>
                  <Badge
                    label={item.is_active ? t('common.active') : t('common.inactive')}
                    variant={item.is_active ? 'success' : 'warning'}
                    size="sm"
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
    gap: spacing.sm,
  },
  headerButton: {
    width: normalize(38),
    height: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
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
  classCard: {
    marginBottom: spacing.sm,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  classMeta: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(2),
  },
});
