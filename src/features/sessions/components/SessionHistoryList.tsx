import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { Session } from '../types';

const STATUS_BADGE: Record<string, 'success' | 'info' | 'default' | 'error' | 'warning'> = {
  completed: 'success',
  in_progress: 'info',
  draft: 'default',
  cancelled: 'error',
};

interface SessionHistoryListProps {
  sessions: Session[];
  onPressSession?: (sessionId: string) => void;
  isLoading?: boolean;
}

export function SessionHistoryList({
  sessions,
  onPressSession,
  isLoading,
}: SessionHistoryListProps) {
  const { t } = useTranslation();

  const renderSession = ({ item }: { item: Session }) => {
    const badgeVariant = STATUS_BADGE[item.status] ?? 'default';

    return (
      <Card
        variant="default"
        onPress={onPressSession ? () => onPressSession(item.id) : undefined}
        style={styles.sessionCard}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Badge label={t(`sessions.${item.status}`)} variant={badgeVariant} size="sm" />
        </View>

        <View style={styles.sessionMeta}>
          {item.duration_minutes != null && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={neutral[400]} />
              <Text style={styles.metaText}>
                {t('sessions.durationMinutes', { minutes: item.duration_minutes })}
              </Text>
            </View>
          )}

          {item.notes && (
            <Text style={styles.notesPreview} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  if (sessions.length === 0 && !isLoading) {
    return (
      <View style={styles.empty}>
        <Ionicons name="book-outline" size={40} color={neutral[300]} />
        <Text style={styles.emptyText}>{t('sessions.noSessions')}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={sessions}
      keyExtractor={(item) => item.id}
      renderItem={renderSession}
      estimatedItemSize={normalize(90)}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sessionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  sessionMeta: {
    marginBlockStart: spacing.xs,
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  notesPreview: {
    ...typography.textStyles.caption,
    color: neutral[400],
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBlock: spacing['3xl'],
  },
  emptyText: {
    ...typography.textStyles.body,
    color: neutral[400],
  },
});
