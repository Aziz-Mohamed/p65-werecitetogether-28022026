import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useProgramLeaderboard } from '@/features/gamification/hooks/useProgramLeaderboard';
import { ProgramLeaderboard } from '@/features/gamification/components/ProgramLeaderboard';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Program Leaderboard Screen ──────────────────────────────────────────────

export default function ProgramLeaderboardScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const theme = useRoleTheme();

  const studentId = session?.user?.id;

  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useProgramLeaderboard(programId, studentId);

  if (isLoading) return <LoadingState />;
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
            {t('gamification.programLeaderboard.title')}
          </Text>
        </View>

        <ProgramLeaderboard
          entries={entries}
          currentStudentId={studentId}
        />
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
});
