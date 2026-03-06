import React, { useCallback, useMemo } from 'react';
import { View, Text, Alert, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback';
import { TrackStatsCard } from '@/features/himam/components/TrackStatsCard';
import { useEventRegistrations } from '@/features/himam/hooks/useEventRegistrations';
import { useRunPairing } from '@/features/himam/hooks/useRunPairing';
import type { RegistrationWithProfiles, HimamTrack } from '@/features/himam/types/himam.types';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export default function SupervisorRegistrationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();

  const { data: registrations, isLoading, error, refetch, isRefetching } =
    useEventRegistrations(eventId);
  const runPairing = useRunPairing();

  const trackStats = useMemo(() => {
    if (!registrations) return [];
    const byTrack = new Map<HimamTrack, { registered: number; paired: number; completed: number; incomplete: number }>();

    for (const reg of registrations) {
      const track = reg.track as HimamTrack;
      const stats = byTrack.get(track) ?? { registered: 0, paired: 0, completed: 0, incomplete: 0 };
      if (reg.status === 'registered') stats.registered++;
      else if (reg.status === 'paired' || reg.status === 'in_progress') stats.paired++;
      else if (reg.status === 'completed') stats.completed++;
      else if (reg.status === 'incomplete') stats.incomplete++;
      byTrack.set(track, stats);
    }

    return Array.from(byTrack.entries()).map(([track, stats]) => ({ track, ...stats }));
  }, [registrations]);

  const handleRunPairing = useCallback(() => {
    if (!eventId) return;
    runPairing.mutate(eventId, {
      onSuccess: (result) => {
        const data = result.data as { pairs_created?: number; unpaired_students?: string[] } | null;
        Alert.alert(
          t('common.success'),
          t('himam.supervisor.pairingSuccess', {
            pairs: data?.pairs_created ?? 0,
            unpaired: data?.unpaired_students?.length ?? 0,
          }),
        );
      },
      onError: () => {
        Alert.alert(t('common.error'), t('himam.errors.unknown'));
      },
    });
  }, [eventId, runPairing, t]);

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('himam.supervisor.registrations')}</Text>

        <Button
          title={t('himam.supervisor.runPairing')}
          onPress={handleRunPairing}
          loading={runPairing.isPending}
          fullWidth
        />

        {trackStats.length > 0 && (
          <View style={styles.statsSection}>
            {trackStats.map((stat) => (
              <TrackStatsCard key={stat.track} {...stat} />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {t('himam.supervisor.registrations')} ({registrations?.length ?? 0})
        </Text>

        <FlashList
          data={registrations ?? []}
          estimatedItemSize={60}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          renderItem={({ item }: { item: RegistrationWithProfiles }) => (
            <View style={styles.regRow}>
              <View style={styles.regInfo}>
                <Text style={styles.regName}>{item.student?.full_name ?? '—'}</Text>
                <Text style={styles.regTrack}>{t(`himam.tracks.${item.track}`)}</Text>
              </View>
              <View style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) + '20' },
              ]}>
                <Text style={[styles.statusChipText, { color: getStatusColor(item.status) }]}>
                  {t(`himam.status.${item.status}`)}
                </Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>{t('himam.noUpcomingEvent')}</Text>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'registered': return lightTheme.primary;
    case 'paired': return lightTheme.success;
    case 'in_progress': return lightTheme.success;
    case 'completed': return lightTheme.success;
    case 'incomplete': return lightTheme.error;
    case 'cancelled': return lightTheme.textSecondary;
    default: return lightTheme.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  statsSection: {
    gap: spacing.md,
  },
  regRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  regInfo: {
    flex: 1,
    gap: 2,
  },
  regName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '500',
  },
  regTrack: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusChipText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: lightTheme.border,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },
});
