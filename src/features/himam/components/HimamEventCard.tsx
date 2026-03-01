import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { HimamEvent, HimamEventStatus } from '../types/himam.types';

const STATUS_VARIANT: Record<HimamEventStatus, 'default' | 'success' | 'warning' | 'error'> = {
  upcoming: 'warning',
  active: 'success',
  completed: 'default',
  cancelled: 'error',
};

interface HimamEventCardProps {
  event: HimamEvent;
  onPress?: () => void;
  registrationCount?: number;
}

export function HimamEventCard({ event, onPress, registrationCount }: HimamEventCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const eventDate = new Date(event.event_date).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );

  return (
    <Card variant="default" onPress={onPress}>
      <View style={styles.header}>
        <Ionicons name="book" size={24} color={lightTheme.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('himam.title')}</Text>
          <Text style={styles.date}>{eventDate}</Text>
        </View>
        <Badge
          variant={STATUS_VARIANT[event.status as HimamEventStatus] ?? 'default'}
          size="sm"
          label={t(`himam.status.${event.status}`)}
        />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={neutral[400]} />
          <Text style={styles.metaText}>
            {event.start_time} – {event.end_time}
          </Text>
        </View>
        {registrationCount != null ? (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={neutral[400]} />
            <Text style={styles.metaText}>{registrationCount}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  date: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
});
