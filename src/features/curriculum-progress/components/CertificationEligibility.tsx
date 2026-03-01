import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { SectionProgressBar } from './SectionProgressBar';
import type { ProgressSummary } from '../types/curriculum-progress.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface CertificationEligibilityProps {
  summary: ProgressSummary;
  eligible: boolean;
  onRecommend?: () => void;
  recommendLoading?: boolean;
  passingThreshold?: number;
}

export function CertificationEligibility({
  summary,
  eligible,
  onRecommend,
  recommendLoading,
  passingThreshold,
}: CertificationEligibilityProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <SectionProgressBar
        percentage={summary.percentage}
        completedSections={summary.completed_sections}
        totalSections={summary.total_sections}
      />

      {passingThreshold != null && (
        <Text style={styles.threshold}>
          {t('curriculumProgress.eligibility.threshold', { threshold: passingThreshold })}
        </Text>
      )}

      {eligible ? (
        <View style={styles.eligibleRow}>
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text style={styles.eligibleText}>
            {t('curriculumProgress.eligibility.eligible')}
          </Text>
        </View>
      ) : (
        <View style={styles.eligibleRow}>
          <Ionicons name="time-outline" size={24} color={neutral[400]} />
          <Text style={styles.notEligibleText}>
            {t('curriculumProgress.eligibility.notEligible')}
          </Text>
        </View>
      )}

      {eligible && onRecommend && (
        <Button
          variant="primary"
          onPress={onRecommend}
          loading={recommendLoading}
          title={t('certifications.recommend')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  threshold: { ...typography.textStyles.caption, color: neutral[500] },
  eligibleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eligibleText: { ...typography.textStyles.bodyMedium, color: '#22c55e' },
  notEligibleText: { ...typography.textStyles.body, color: neutral[500] },
});
