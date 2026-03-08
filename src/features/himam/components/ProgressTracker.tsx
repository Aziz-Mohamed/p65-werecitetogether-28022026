import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { HimamProgress } from '../types/himam.types';

interface ProgressTrackerProps {
  progress: HimamProgress[];
  onMarkComplete: (juzNumber: number) => void;
  isEventActive: boolean;
  isPending?: boolean;
}

export function ProgressTracker({
  progress,
  onMarkComplete,
  isEventActive,
  isPending,
}: ProgressTrackerProps) {
  const { t } = useTranslation();

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const totalCount = progress.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allComplete = completedCount === totalCount && totalCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('himam.progress.title')}</Text>
        <Text style={styles.progressCount}>
          {t('himam.progress.juzProgress', { completed: completedCount, total: totalCount })}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
      </View>

      {allComplete && (
        <View style={styles.celebrationRow}>
          <Ionicons name="checkmark-circle" size={20} color={lightTheme.success} />
          <Text style={styles.celebrationText}>{t('himam.progress.allComplete')}</Text>
        </View>
      )}

      {!isEventActive && !allComplete && (
        <Text style={styles.notActiveText}>{t('himam.progress.eventNotActive')}</Text>
      )}

      <View style={styles.list}>
        {progress.map((item) => {
          const isCompleted = item.status === 'completed';
          return (
            <View key={item.juz_number} style={styles.juzRow}>
              <View style={styles.juzInfo}>
                <View style={[styles.juzBadge, isCompleted && styles.juzBadgeCompleted]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color={lightTheme.card} />
                  ) : (
                    <Text style={styles.juzBadgeText}>{item.juz_number}</Text>
                  )}
                </View>
                <Text style={[styles.juzLabel, isCompleted && styles.juzLabelCompleted]}>
                  {t('himam.juzPicker.juzNumber', { number: item.juz_number })}
                </Text>
              </View>

              {isCompleted ? (
                <Text style={styles.completedLabel}>{t('himam.progress.completed')}</Text>
              ) : isEventActive ? (
                <Pressable
                  style={styles.markButton}
                  onPress={() => onMarkComplete(item.juz_number)}
                  disabled={isPending}
                >
                  <Text style={styles.markButtonText}>{t('himam.progress.markComplete')}</Text>
                </Pressable>
              ) : (
                <Text style={styles.pendingLabel}>{t('himam.progress.pending')}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  progressCount: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: lightTheme.success,
    borderRadius: 4,
  },
  celebrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  celebrationText: {
    ...typography.textStyles.body,
    color: lightTheme.success,
    fontWeight: '600',
  },
  notActiveText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  list: {
    gap: spacing.xs,
  },
  juzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: lightTheme.card,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  juzInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  juzBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: lightTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  juzBadgeCompleted: {
    backgroundColor: lightTheme.success,
  },
  juzBadgeText: {
    ...typography.textStyles.caption,
    color: lightTheme.text,
    fontWeight: '600',
  },
  juzLabel: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  juzLabelCompleted: {
    color: lightTheme.textSecondary,
    textDecorationLine: 'line-through',
  },
  completedLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.success,
    fontWeight: '600',
  },
  pendingLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  markButton: {
    backgroundColor: lightTheme.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  markButtonText: {
    ...typography.textStyles.caption,
    color: lightTheme.card,
    fontWeight: '600',
  },
});
