import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { CertificationPipeline, CertificationStatus } from '../types/certifications.types';

const STATUS_COLORS: Record<CertificationStatus, string> = {
  recommended: colors.primary[500],
  supervisor_approved: colors.secondary[500],
  issued: colors.accent.emerald,
  returned: colors.secondary[400],
  rejected: colors.accent.rose,
  revoked: lightTheme.textSecondary,
};

interface CertificatePipelineProps {
  pipeline: CertificationPipeline;
  selectedStatus?: CertificationStatus | null;
  onFilterStatus: (status: CertificationStatus | null) => void;
}

export function CertificatePipelineView({
  pipeline,
  selectedStatus,
  onFilterStatus,
}: CertificatePipelineProps) {
  const { t } = useTranslation();

  const statuses: { key: CertificationStatus; count: number }[] = [
    { key: 'recommended', count: pipeline.recommended },
    { key: 'supervisor_approved', count: pipeline.supervisor_approved },
    { key: 'issued', count: pipeline.issued },
    { key: 'returned', count: pipeline.returned },
    { key: 'rejected', count: pipeline.rejected },
    { key: 'revoked', count: pipeline.revoked },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('certifications.pipeline.title')}</Text>
        <Pressable onPress={() => onFilterStatus(null)} hitSlop={8}>
          <Text style={styles.totalText}>
            {t('certifications.pipeline.total')}: {pipeline.total}
          </Text>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {statuses.map(({ key, count }) => {
          const isSelected = selectedStatus === key;
          return (
            <Pressable
              key={key}
              style={[
                styles.chip,
                { borderColor: STATUS_COLORS[key] },
                isSelected && { backgroundColor: STATUS_COLORS[key] },
              ]}
              onPress={() => onFilterStatus(isSelected ? null : key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#fff' : STATUS_COLORS[key] },
                ]}
              >
                {t(`certifications.statuses.${key}`)} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  totalText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },
});
