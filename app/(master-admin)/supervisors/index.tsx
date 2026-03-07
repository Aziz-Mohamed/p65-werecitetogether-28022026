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
import { useSupervisors } from '@/features/admin/hooks/useSupervisors';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function AdminSupervisorsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { resolveName } = useLocalizedName();

  const { data: supervisors = [], isLoading, error, refetch } = useSupervisors({
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
          <Text style={styles.title}>{t('admin.supervisors.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={t('admin.supervisors.searchPlaceholder')}
          style={styles.searchBar}
        />

        {supervisors.length === 0 ? (
          <EmptyState
            icon="eye-outline"
            title={t('admin.supervisors.emptyTitle')}
            description={t('admin.supervisors.emptyDescription')}
          />
        ) : (
          <FlashList
            data={supervisors}
            keyExtractor={(item: any) => item.id}

            renderItem={({ item }: { item: any }) => (
              <Card
                variant="default"
                style={styles.card}
                onPress={() => router.push({ pathname: '/(master-admin)/users/[id]', params: { id: item.id } })}
              >
                <View style={styles.row}>
                  <Avatar
                    source={item.avatar_url ?? undefined}
                    name={resolveName(item.name_localized, item.full_name)}
                    size="sm"
                  />
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {resolveName(item.name_localized, item.full_name)}
                    </Text>
                    {item.username ? (
                      <Text style={styles.meta} numberOfLines={1}>@{item.username}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={16}
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
  headerSpacer: {
    width: normalize(80),
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
    marginBottom: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
