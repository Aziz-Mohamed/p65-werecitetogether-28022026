import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { neutral, semantic, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import type { HimamProgress, HimamProgressStatus } from '../types/himam.types';

const STATUS_CONFIG: Record<HimamProgressStatus, { icon: string; color: string; bg: string }> = {
  pending: { icon: 'ellipse-outline', color: neutral[400], bg: neutral[100] },
  completed: { icon: 'checkmark-circle', color: semantic.success, bg: '#D1FAE5' },
  partner_absent: { icon: 'alert-circle', color: semantic.warning, bg: '#FEF3C7' },
};

interface JuzProgressGridProps {
  progress: HimamProgress[];
  onJuzPress?: (juzNumber: number) => void;
}

export function JuzProgressGrid({ progress, onJuzPress }: JuzProgressGridProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('himam.progress.title')}</Text>
      <View style={styles.grid}>
        {progress.map((item) => {
          const config = STATUS_CONFIG[item.status as HimamProgressStatus] ?? STATUS_CONFIG.pending;
          return (
            <Pressable
              key={item.juz_number}
              style={[styles.cell, { backgroundColor: config.bg }]}
              onPress={() => onJuzPress?.(item.juz_number)}
              accessibilityLabel={t('himam.progress.juzNumber', { number: item.juz_number })}
            >
              <Ionicons name={config.icon as any} size={18} color={config.color} />
              <Text style={[styles.juzNumber, { color: config.color }]}>
                {item.juz_number}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: config.color }]} />
            <Text style={styles.legendText}>{t(`himam.progress.${status}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.label,
    color: neutral[800],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  juzNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
});
