import React from 'react';
import { I18nManager, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';
import { useRewardsDashboard } from '@/features/gamification/hooks/useRewardsDashboard';
import { RewardsDashboard } from '@/features/gamification/components/RewardsDashboard';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Supervisor Rewards Screen ───────────────────────────────────────────────

export default function SupervisorRewardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const theme = useRoleTheme();
  const userId = session?.user?.id;

  const teachers = useSupervisedTeachers(userId);
  const programId = teachers.data?.[0]?.program_id;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useRewardsDashboard(programId);

  if (teachers.isLoading || isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        description={(error as Error).message}
        onRetry={refetch}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={
              <Ionicons
                name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
                size={20}
                color={theme.primary}
              />
            }
          />
          <Text style={styles.title}>
            {t('gamification.rewardsDashboard.title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {data && <RewardsDashboard data={data} />}
        </ScrollView>
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
});
