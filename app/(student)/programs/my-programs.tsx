import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout/Screen';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { Card } from '@/components/ui/Card';
import { EnrollmentStatusBadge } from '@/features/programs/components/EnrollmentStatusBadge';
import { useEnrollments } from '@/features/programs/hooks/useEnrollments';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { EnrollmentWithDetails } from '@/features/programs/types/programs.types';

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  pending: 1,
  waitlisted: 2,
  completed: 3,
  dropped: 4,
};

export default function MyProgramsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const { data: enrollments, isLoading, error, refetch } = useEnrollments(userId);

  const sorted = useMemo(
    () =>
      [...(enrollments ?? [])].sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
      ),
    [enrollments],
  );

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="arrow-back" size={normalize(24)} color={lightTheme.text} />
      </Pressable>
      <Text style={styles.title}>{t('programs.myPrograms')}</Text>

      {sorted.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title={t('programs.empty.enrollments')}
          description={t('programs.empty.enrollmentsDesc')}
        />
      ) : (
        <FlashList
          data={sorted}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          contentContainerStyle={{ padding: spacing.base }}
          renderItem={({ item }: { item: EnrollmentWithDetails }) => (
            <Card
              variant="outlined"
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/(student)/programs/[id]',
                  params: { id: item.program_id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.programName} numberOfLines={1}>
                  {item.programs
                    ? localize(item.programs.name, item.programs.name_ar)
                    : '—'}
                </Text>
                <EnrollmentStatusBadge status={item.status} />
              </View>
              {item.program_tracks && (
                <Text style={styles.detail} numberOfLines={1}>
                  {localize(item.program_tracks.name, item.program_tracks.name_ar)}
                </Text>
              )}
              {item.classes?.profiles?.full_name && (
                <View style={styles.row}>
                  <Ionicons
                    name="person-outline"
                    size={normalize(14)}
                    color={lightTheme.textSecondary}
                  />
                  <Text style={styles.detail}>
                    {item.classes.profiles.full_name}
                  </Text>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  detail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
