import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { MutoonProgressWithTrack, MutoonStatus } from '../types/mutoon.types';

interface MutoonProgressCardProps {
  progress: MutoonProgressWithTrack;
}

const statusVariant: Record<MutoonStatus, 'warning' | 'success' | 'info'> = {
  in_progress: 'warning',
  completed: 'success',
  certified: 'info',
};

export function MutoonProgressCard({ progress }: MutoonProgressCardProps) {
  const { t } = useTranslation();
  const localize = useLocalizedField();

  const percentage = progress.total_lines > 0
    ? Math.round((progress.current_line / progress.total_lines) * 100)
    : 0;

  const trackName = progress.program_tracks
    ? localize(progress.program_tracks.name, progress.program_tracks.name_ar)
    : '—';

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
        <Badge
          label={t(`mutoon.status.${progress.status}`)}
          variant={statusVariant[progress.status]}
          size="sm"
        />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(percentage, 100)}%` },
              progress.status === 'certified' && styles.progressBarCertified,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.current_line}/{progress.total_lines}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="book-outline" size={normalize(14)} color={lightTheme.textSecondary} />
          <Text style={styles.statText}>
            {t('mutoon.linesCompleted', { count: progress.current_line })}
          </Text>
        </View>
        {progress.review_count > 0 && (
          <View style={styles.stat}>
            <Ionicons name="refresh-outline" size={normalize(14)} color={lightTheme.textSecondary} />
            <Text style={styles.statText}>
              {t('mutoon.reviews', { count: progress.review_count })}
            </Text>
          </View>
        )}
      </View>

      {progress.status === 'certified' && progress.certified_at && (
        <View style={styles.certifiedRow}>
          <Ionicons name="checkmark-circle" size={normalize(16)} color={colors.primary[500]} />
          <Text style={styles.certifiedText}>
            {t('mutoon.certifiedOn', {
              date: new Date(progress.certified_at).toLocaleDateString(),
            })}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: normalize(8),
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: normalize(4),
  },
  progressBarCertified: {
    backgroundColor: colors.accent.blue[500],
  },
  progressText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    minWidth: normalize(50),
    textAlign: 'auto',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  certifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: lightTheme.border,
  },
  certifiedText: {
    ...typography.textStyles.caption,
    color: colors.primary[500],
  },
});
