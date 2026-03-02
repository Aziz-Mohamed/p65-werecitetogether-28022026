import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { LoadingState, EmptyState } from '@/components/feedback';
import { useCurriculumProgress } from '@/features/curriculum-progress/hooks/useCurriculumProgress';
import { useCompletionPercentage } from '@/features/curriculum-progress/hooks/useCompletionPercentage';
import { SectionProgressBar } from '@/features/curriculum-progress/components/SectionProgressBar';
import { SectionProgressList } from '@/features/curriculum-progress/components/SectionProgressList';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function StudentCurriculumProgressScreen() {
  const { t } = useTranslation();
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();

  const { data: sections = [], isLoading } = useCurriculumProgress(enrollmentId);
  const { data: summary } = useCompletionPercentage(enrollmentId);

  if (isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('curriculumProgress.myProgress')}</Text>

        {summary && (
          <Card variant="default">
            <SectionProgressBar
              percentage={summary.percentage}
              completedSections={summary.completed_sections}
              totalSections={summary.total_sections}
            />
          </Card>
        )}

        {sections.length === 0 ? (
          <EmptyState icon="book-outline" title={t('curriculumProgress.noSections')} />
        ) : (
          <Card variant="default">
            <SectionProgressList sections={sections} />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.base, paddingVertical: spacing.base },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
});
