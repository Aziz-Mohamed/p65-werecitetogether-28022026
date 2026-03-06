import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { HimamTrack } from '../types/himam.types';

interface TrackStatsCardProps {
  track: HimamTrack;
  registered: number;
  paired: number;
  completed: number;
  incomplete: number;
}

export function TrackStatsCard({
  track,
  registered,
  paired,
  completed,
  incomplete,
}: TrackStatsCardProps) {
  const { t } = useTranslation();

  const total = registered + paired + completed + incomplete;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.trackName}>{t(`himam.tracks.${track}`)}</Text>

      <View style={styles.statsRow}>
        <StatItem label={t('himam.status.registered')} value={registered} />
        <StatItem label={t('himam.status.paired')} value={paired} />
        <StatItem label={t('himam.status.completed')} value={completed} color={lightTheme.success} />
        <StatItem label={t('himam.status.incomplete')} value={incomplete} color={lightTheme.error} />
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>{t('himam.supervisor.completionRate')}</Text>
        <Text style={styles.rateValue}>{completionRate}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.card,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '700',
    fontSize: 18,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  rateValue: {
    ...typography.textStyles.body,
    color: lightTheme.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: lightTheme.success,
    borderRadius: 3,
  },
});
