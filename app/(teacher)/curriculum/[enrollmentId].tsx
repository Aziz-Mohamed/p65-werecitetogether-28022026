import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/feedback';
import { useCurriculumProgress, useUpdateSectionProgress } from '@/features/curriculum-progress/hooks/useCurriculumProgress';
import { useCompletionPercentage } from '@/features/curriculum-progress/hooks/useCompletionPercentage';
import { SectionProgressBar } from '@/features/curriculum-progress/components/SectionProgressBar';
import { SectionProgressList } from '@/features/curriculum-progress/components/SectionProgressList';
import { SectionUpdateForm } from '@/features/curriculum-progress/components/SectionUpdateForm';
import { CertificationEligibility } from '@/features/curriculum-progress/components/CertificationEligibility';
import type { CurriculumProgress, ProgressType, UpdateSectionInput } from '@/features/curriculum-progress/types/curriculum-progress.types';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function TeacherCurriculumWorkspaceScreen() {
  const { t } = useTranslation();
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();

  const { data: sections = [], isLoading } = useCurriculumProgress(enrollmentId);
  const { data: summary } = useCompletionPercentage(enrollmentId);
  const updateMutation = useUpdateSectionProgress(enrollmentId);

  const [selectedSection, setSelectedSection] = useState<CurriculumProgress | null>(null);

  // Derive progress type from first section
  const progressType = (sections[0]?.progress_type ?? 'mutoon') as ProgressType;

  const handleUpdate = useCallback(
    (input: UpdateSectionInput) => {
      if (!selectedSection) return;
      updateMutation.mutate(
        { progressId: selectedSection.id, input },
        { onSuccess: () => setSelectedSection(null) },
      );
    },
    [selectedSection, updateMutation],
  );

  if (isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('curriculumProgress.teacherWorkspace')}</Text>

        {summary && (
          <Card variant="default">
            <CertificationEligibility
              summary={summary}
              eligible={summary.percentage >= 100}
            />
          </Card>
        )}

        {selectedSection ? (
          <Card variant="default" style={styles.formCard}>
            <SectionUpdateForm
              section={selectedSection}
              progressType={progressType}
              onSubmit={handleUpdate}
              loading={updateMutation.isPending}
            />
          </Card>
        ) : null}

        <Card variant="default">
          <SectionProgressList
            sections={sections}
            onSectionPress={setSelectedSection}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.base, paddingVertical: spacing.base },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
  formCard: { padding: spacing.md },
});
