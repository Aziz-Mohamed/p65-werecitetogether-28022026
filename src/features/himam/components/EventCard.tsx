import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { HimamEvent } from '../types/himam.types';

interface EventCardProps {
  event: HimamEvent;
  registrationCount?: number;
}

export function EventCard({ event, registrationCount }: EventCardProps) {
  const { t } = useTranslation();

  const eventDate = new Date(event.event_date + 'T00:00:00');
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deadlineDate = new Date(event.registration_deadline);
  const formattedDeadline = deadlineDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const msUntilEvent = eventDate.getTime() - now.getTime();
  const daysUntilEvent = Math.max(0, Math.ceil(msUntilEvent / (1000 * 60 * 60 * 24)));

  const statusColor = event.status === 'upcoming'
    ? lightTheme.primary
    : event.status === 'active'
      ? lightTheme.success
      : event.status === 'cancelled'
        ? lightTheme.error
        : lightTheme.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('himam.title')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`himam.status.${event.status}`)}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color={lightTheme.textSecondary} />
        <Text style={styles.infoText}>{formattedDate}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color={lightTheme.textSecondary} />
        <Text style={styles.infoText}>
          {t('himam.deadline')}: {formattedDeadline} ({t('himam.makkahTime')})
        </Text>
      </View>

      {registrationCount !== undefined && (
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color={lightTheme.textSecondary} />
          <Text style={styles.infoText}>
            {registrationCount} {t('himam.supervisor.registrations').toLowerCase()}
          </Text>
        </View>
      )}

      {event.status === 'upcoming' && daysUntilEvent > 0 && (
        <View style={styles.countdownRow}>
          <Text style={styles.countdownLabel}>{t('himam.countdown')}</Text>
          <Text style={styles.countdownValue}>
            {daysUntilEvent} {daysUntilEvent === 1 ? 'day' : 'days'}
          </Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    flex: 1,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: lightTheme.border,
  },
  countdownLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  countdownValue: {
    ...typography.textStyles.body,
    color: lightTheme.primary,
    fontWeight: '600',
  },
});
