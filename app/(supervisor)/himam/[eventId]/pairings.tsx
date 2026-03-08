import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Alert, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback';
import { TrackStatsCard } from '@/features/himam/components/TrackStatsCard';
import { useEventRegistrations } from '@/features/himam/hooks/useEventRegistrations';
import { useEventStats } from '@/features/himam/hooks/useEventStats';
import { himamService } from '@/features/himam/services/himam.service';
import type { RegistrationWithProfiles, HimamTrack } from '@/features/himam/types/himam.types';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export default function SupervisorPairingsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { t } = useTranslation();

  const { data: registrations, error, refetch } = useEventRegistrations(eventId);
  const { data: stats } = useEventStats(eventId);

  const [selectedForSwap, setSelectedForSwap] = useState<string[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);

  const paired = useMemo(
    () => registrations?.filter((r) => r.partner_id) ?? [],
    [registrations],
  );

  const unpaired = useMemo(
    () => registrations?.filter((r) => !r.partner_id && r.status === 'registered') ?? [],
    [registrations],
  );

  const trackStats = useMemo(() => {
    if (!registrations) return [];
    const byTrack = new Map<HimamTrack, { registered: number; paired: number; completed: number; incomplete: number }>();

    for (const reg of registrations) {
      const track = reg.track as HimamTrack;
      const s = byTrack.get(track) ?? { registered: 0, paired: 0, completed: 0, incomplete: 0 };
      if (reg.status === 'registered') s.registered++;
      else if (reg.status === 'paired' || reg.status === 'in_progress') s.paired++;
      else if (reg.status === 'completed') s.completed++;
      else if (reg.status === 'incomplete') s.incomplete++;
      byTrack.set(track, s);
    }

    return Array.from(byTrack.entries()).map(([track, s]) => ({ track, ...s }));
  }, [registrations]);

  const toggleSwapSelection = useCallback((regId: string) => {
    setSelectedForSwap((prev) => {
      if (prev.includes(regId)) return prev.filter((id) => id !== regId);
      if (prev.length >= 2) return prev;
      return [...prev, regId];
    });
  }, []);

  const handleSwap = useCallback(async () => {
    if (selectedForSwap.length !== 2) return;
    setIsSwapping(true);
    const { error: swapError } = await himamService.swapPartners({
      registrationIdA: selectedForSwap[0],
      registrationIdB: selectedForSwap[1],
    });
    setIsSwapping(false);
    if (swapError) {
      Alert.alert(t('common.error'), (swapError as Error).message);
    } else {
      Alert.alert(t('common.success'), t('himam.supervisor.swapPartners'));
      setSelectedForSwap([]);
      refetch();
    }
  }, [selectedForSwap, t, refetch]);

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('himam.supervisor.pairings')}</Text>

        {trackStats.length > 0 && (
          <View style={styles.statsSection}>
            {trackStats.map((stat) => (
              <TrackStatsCard key={stat.track} {...stat} />
            ))}
          </View>
        )}

        {selectedForSwap.length === 2 && (
          <Button
            title={t('himam.supervisor.swapPartners')}
            onPress={handleSwap}
            loading={isSwapping}
            fullWidth
          />
        )}

        <Text style={styles.sectionTitle}>
          {t('himam.supervisor.pairings')} ({paired.length})
        </Text>

        {paired.map((reg) => {
          const isSelected = selectedForSwap.includes(reg.id);
          return (
            <Pressable
              key={reg.id}
              style={[styles.pairRow, isSelected && styles.pairRowSelected]}
              onPress={() => toggleSwapSelection(reg.id)}
            >
              <View style={styles.pairInfo}>
                <Text style={styles.pairName}>{reg.student?.full_name ?? '—'}</Text>
                <View style={styles.pairMeta}>
                  <Ionicons name="swap-horizontal" size={12} color={lightTheme.textSecondary} />
                  <Text style={styles.partnerName}>{reg.partner?.full_name ?? '—'}</Text>
                </View>
              </View>
              <Text style={styles.pairTrack}>{t(`himam.tracks.${reg.track}`)}</Text>
            </Pressable>
          );
        })}

        {unpaired.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('himam.supervisor.unpaired')} ({unpaired.length})
            </Text>
            {unpaired.map((reg) => (
              <View key={reg.id} style={styles.unpairedRow}>
                <Text style={styles.pairName}>{reg.student?.full_name ?? '—'}</Text>
                <Text style={styles.pairTrack}>{t(`himam.tracks.${reg.track}`)}</Text>
              </View>
            ))}
          </>
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
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lightTheme.card,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pairRowSelected: {
    borderColor: lightTheme.primary,
    backgroundColor: lightTheme.primary + '08',
  },
  pairInfo: {
    flex: 1,
    gap: 2,
  },
  pairName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '500',
  },
  pairMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  partnerName: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  pairTrack: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  unpairedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lightTheme.error + '08',
    borderRadius: 8,
    padding: spacing.sm,
  },
});
