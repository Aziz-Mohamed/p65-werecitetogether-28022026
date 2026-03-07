import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import type { HimamEvent, RegistrationWithProfiles } from '../types/himam.types';

interface HimamDashboardCardProps {
  event: HimamEvent;
  registration?: RegistrationWithProfiles | null;
  onPress: () => void;
}

export function HimamDashboardCard({ event, registration, onPress }: HimamDashboardCardProps) {
  const { t } = useTranslation();

  const eventDate = new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card variant="default" onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={20} color={colors.accent.violet[500]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('himam.dashboard.nextEvent')}</Text>
          <Text style={styles.date}>{eventDate}</Text>
        </View>
        <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
      </View>

      {registration && registration.status !== 'cancelled' && (
        <View style={styles.statusRow}>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>{t(`himam.status.${registration.status}`)}</Text>
          </View>
          {registration.partner && (
            <Text style={styles.partnerInfo} numberOfLines={1}>
              {t('himam.partner.label')}: {registration.partner.full_name}
            </Text>
          )}
        </View>
      )}

      {!registration && (
        <Text style={styles.cta}>{t('himam.dashboard.viewDetails')}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    backgroundColor: colors.accent.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  date: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusChip: {
    backgroundColor: lightTheme.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    ...typography.textStyles.caption,
    color: lightTheme.success,
    fontWeight: '600',
  },
  partnerInfo: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    flex: 1,
  },
  cta: {
    ...typography.textStyles.caption,
    color: lightTheme.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
