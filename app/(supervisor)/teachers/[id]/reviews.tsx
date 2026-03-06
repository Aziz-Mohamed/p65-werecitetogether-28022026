import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { I18nManager } from 'react-native';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { RatingStatsCard } from '@/features/ratings/components/RatingStatsCard';
import { SupervisorReviewList } from '@/features/ratings/components/SupervisorReviewList';
import { useTeacherRatingStats } from '@/features/ratings/hooks/useTeacherRatingStats';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SupervisorTeacherReviewsScreen() {
  const { id: teacherId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useRoleTheme();

  // For now, use a programId from search params or default
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { data: stats } = useTeacherRatingStats(teacherId, programId);

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.primary} />}
        />

        <Text style={styles.title}>{t('ratings.supervisor.reviews')}</Text>

        {stats && <RatingStatsCard stats={stats} />}

        {teacherId && programId && (
          <SupervisorReviewList teacherId={teacherId} programId={programId} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
});
