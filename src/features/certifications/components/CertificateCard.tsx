import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { CertificationWithRelations, CertificationStatus } from '../types/certifications.types';

const STATUS_VARIANT: Record<CertificationStatus, 'success' | 'error' | 'default'> = {
  recommended: 'default',
  supervisor_approved: 'default',
  issued: 'success',
  rejected: 'error',
  revoked: 'error',
};

interface CertificateCardProps {
  certification: CertificationWithRelations;
  onPress?: () => void;
}

export function CertificateCard({ certification, onPress }: CertificateCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const programName = isAr ? certification.program?.name_ar : certification.program?.name;
  const trackName = certification.track
    ? isAr ? certification.track.name_ar : certification.track.name
    : null;

  return (
    <Card variant="default" onPress={onPress}>
      <View style={styles.header}>
        <Ionicons name="ribbon" size={24} color={lightTheme.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {isAr ? certification.title_ar : certification.title}
          </Text>
          {programName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {programName}
            </Text>
          ) : null}
        </View>
        <Badge
          variant={STATUS_VARIANT[certification.status as CertificationStatus] ?? 'default'}
          size="sm"
          label={t(`certifications.status.${certification.status}`)}
        />
      </View>

      {trackName ? (
        <Text style={styles.track} numberOfLines={1}>
          {trackName}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color={neutral[400]} />
          <Text style={styles.metaText}>
            {certification.teacher?.display_name ?? certification.teacher?.full_name}
          </Text>
        </View>
        {certification.issue_date ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={neutral[400]} />
            <Text style={styles.metaText}>
              {new Date(certification.issue_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
            </Text>
          </View>
        ) : null}
        {certification.certificate_number ? (
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={neutral[400]} />
            <Text style={styles.metaText}>{certification.certificate_number}</Text>
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
  subtitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  track: {
    ...typography.textStyles.caption,
    color: neutral[500],
    marginTop: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
