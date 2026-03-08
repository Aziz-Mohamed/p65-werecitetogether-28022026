import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useHimamHistory } from '@/features/himam/hooks/useHimamHistory';
import type { RegistrationWithEvent } from '@/features/himam/types/himam.types';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export default function HimamHistoryScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: history, isLoading, error, refetch, isRefetching } = useHimamHistory(userId);

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('himam.history.title')}</Text>

        <FlashList
          data={history ?? []}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          renderItem={({ item }: { item: RegistrationWithEvent }) => {
            const eventDate = item.event
              ? new Date(item.event.event_date + 'T00:00:00').toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—';

            const statusColor =
              item.status === 'completed'
                ? lightTheme.success
                : item.status === 'incomplete'
                  ? lightTheme.error
                  : lightTheme.textSecondary;

            return (
              <View style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{eventDate}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {t(`himam.status.${item.status}`)}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyMeta}>
                  <Text style={styles.metaText}>
                    {t(`himam.tracks.${item.track}`)}
                  </Text>
                  {item.partner && (
                    <Text style={styles.metaText}>
                      {t('himam.partner.label')}: {item.partner.full_name}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('himam.history.noHistory')}</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
    marginBottom: spacing.base,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  historyItem: {
    backgroundColor: lightTheme.card,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
    gap: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },
  historyMeta: {
    gap: 2,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
