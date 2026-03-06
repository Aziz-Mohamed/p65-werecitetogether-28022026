import React, { useCallback } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { EventCard } from '@/features/himam/components/EventCard';
import { useHimamEvents } from '@/features/himam/hooks/useHimamEvents';
import { useCancelEvent } from '@/features/himam/hooks/useCancelEvent';
import { himamService } from '@/features/himam/services/himam.service';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';
import type { HimamEvent } from '@/features/himam/types/himam.types';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export default function SupervisorHimamScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const teachers = useSupervisedTeachers(userId);
  const programId = teachers.data?.[0]?.program_id;

  const { data: events, isLoading, error, refetch, isRefetching } = useHimamEvents(programId);
  const cancelEvent = useCancelEvent();

  const handleCreateEvent = useCallback(async () => {
    const nextSat = getNextSaturday();
    const { data, error: err } = await himamService.createEvent(nextSat);
    if (err) {
      Alert.alert(t('common.error'), (err as Error).message);
    } else {
      Alert.alert(t('common.success'), t('himam.supervisor.createEvent'));
      refetch();
    }
  }, [t, refetch]);

  const handleCancelEvent = useCallback(
    (eventId: string) => {
      Alert.alert(
        t('himam.supervisor.cancelEvent'),
        t('himam.supervisor.cancelEventConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: () => {
              cancelEvent.mutate(eventId, {
                onSuccess: () => {
                  Alert.alert(t('common.success'), t('himam.supervisor.eventCancelled'));
                },
                onError: () => {
                  Alert.alert(t('common.error'), t('himam.errors.unknown'));
                },
              });
            },
          },
        ],
      );
    },
    [cancelEvent, t],
  );

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('himam.supervisor.title')}</Text>
          <Button
            title={t('himam.supervisor.createEvent')}
            onPress={handleCreateEvent}
            size="sm"
          />
        </View>

        <FlashList
          data={events ?? []}
          estimatedItemSize={160}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          renderItem={({ item }: { item: HimamEvent }) => (
            <View style={styles.eventItem}>
              <Pressable onPress={() => router.push(`/(supervisor)/himam/${item.id}/registrations`)}>
                <EventCard event={item} />
              </Pressable>
              {item.status === 'upcoming' && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => router.push(`/(supervisor)/himam/${item.id}/registrations`)}
                  >
                    <Ionicons name="people-outline" size={16} color={lightTheme.primary} />
                    <Text style={styles.actionText}>{t('himam.supervisor.registrations')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={() => handleCancelEvent(item.id)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={lightTheme.error} />
                    <Text style={[styles.actionText, styles.dangerText]}>
                      {t('himam.supervisor.cancelEvent')}
                    </Text>
                  </Pressable>
                </View>
              )}
              {(item.status === 'active' || item.status === 'completed') && (
                <Pressable
                  style={styles.actionButton}
                  onPress={() => router.push(`/(supervisor)/himam/${item.id}/pairings`)}
                >
                  <Ionicons name="stats-chart-outline" size={16} color={lightTheme.primary} />
                  <Text style={styles.actionText}>{t('himam.supervisor.stats')}</Text>
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('himam.noUpcomingEvent')}</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Screen>
  );
}

function getNextSaturday(): string {
  const now = new Date();
  const makkah = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = makkah.getUTCDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const nextSat = new Date(makkah);
  nextSat.setUTCDate(nextSat.getUTCDate() + daysUntilSat);
  return nextSat.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  eventItem: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: lightTheme.primary + '10',
    borderRadius: 8,
  },
  actionText: {
    ...typography.textStyles.caption,
    color: lightTheme.primary,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: lightTheme.error + '10',
  },
  dangerText: {
    color: lightTheme.error,
  },
  separator: {
    height: spacing.base,
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
