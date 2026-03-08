import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { RecommendationForm } from '@/features/certifications/components/RecommendationForm';
import { useRecommendCertification } from '@/features/certifications/hooks/useRecommendCertification';

export default function RecommendScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: studentId, programId, trackId, studentName } = useLocalSearchParams<{
    id: string;
    programId: string;
    trackId?: string;
    studentName?: string;
  }>();

  const recommend = useRecommendCertification();

  const handleSubmit = (values: { type: string; title: string; titleAr?: string; notes?: string }) => {
    if (!studentId || !programId) return;

    recommend.mutate(
      {
        studentId,
        programId,
        trackId: trackId || undefined,
        type: values.type as 'ijazah' | 'graduation' | 'completion',
        title: values.title,
        titleAr: values.titleAr,
        notes: values.notes,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('certifications.form.success'));
          router.back();
        },
        onError: (error) => {
          const msg = (error as { message?: string })?.message ?? '';
          const errorKey = Object.keys(t('certifications.errors', { returnObjects: true }) as Record<string, string>)
            .find((key) => msg.includes(key));
          Alert.alert(
            t('common.error'),
            errorKey ? t(`certifications.errors.${errorKey}`) : t('certifications.errors.unknown'),
          );
        },
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('certifications.form.title')}</Text>

        {studentName && (
          <View style={styles.studentHeader}>
            <Text style={styles.studentLabel}>{t('certifications.detail.student')}</Text>
            <Text style={styles.studentName}>{studentName}</Text>
          </View>
        )}

        <RecommendationForm
          onSubmit={handleSubmit}
          isLoading={recommend.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBottom: spacing.base,
  },
  studentHeader: {
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  studentLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  studentName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
});
