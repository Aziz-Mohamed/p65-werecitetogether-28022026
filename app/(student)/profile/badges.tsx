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
import { useRTL } from '@/hooks/useRTL';
import { useEnrollments } from '@/features/programs/hooks/useEnrollments';
import { useStudentBadges } from '@/features/gamification/hooks/useStudentBadges';
import { BadgeGrid } from '@/features/gamification/components/BadgeGrid';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Badges Screen ───────────────────────────────────────────────────────────

export default function BadgesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const { isRTL } = useRTL();
  const theme = useRoleTheme();

  const studentId = session?.user?.id;

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
  } = useEnrollments(studentId);

  // For now, show badges across all enrolled programs (no program filter)
  const {
    badges,
    isLoading: badgesLoading,
    error,
    refetch,
  } = useStudentBadges(studentId, undefined);

  const isLoading = enrollmentsLoading || badgesLoading;

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
          <Text style={styles.title}>{t('gamification.badges.title')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BadgeGrid badges={badges} />
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
