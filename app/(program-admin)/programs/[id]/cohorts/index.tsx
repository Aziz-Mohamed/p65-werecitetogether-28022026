import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useCohorts } from '@/features/programs/hooks/useCohorts';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { CohortWithTeacher } from '@/features/programs/types/programs.types';

export default function CohortListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: cohorts = [], isLoading, error, refetch } = useCohorts({ programId: id! });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.labels.cohorts')}</Text>
          <Button
            title={t('common.create')}
            onPress={() => router.push(`/(program-admin)/programs/${id}/cohorts/create`)}
            variant="primary"
            size="sm"
            icon={<Ionicons name="add" size={18} color={colors.white} />}
          />
        </View>

        {cohorts.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('programs.empty.cohorts')}
            description={t('programs.empty.cohortsDesc')}
          />
        ) : (
          <FlashList
            data={cohorts}
            keyExtractor={(item) => item.id}
            estimatedItemSize={90}
            renderItem={({ item }: { item: CohortWithTeacher }) => {
              const enrolledCount = item.enrollments?.[0]?.count ?? 0;
              return (
                <Card
                  variant="outlined"
                  style={styles.card}
                  onPress={() =>
                    router.push(`/(program-admin)/programs/${id}/cohorts/${item.id}`)
                  }
                >
                  <View style={styles.cardRow}>
                    <Text style={styles.cohortName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Badge
                      label={t(`programs.cohortStatus.${item.status}`)}
                      variant={item.status === 'enrollment_open' ? 'success' : 'info'}
                      size="sm"
                    />
                  </View>
                  <View style={styles.meta}>
                    {item.profiles?.full_name && (
                      <View style={styles.metaRow}>
                        <Ionicons name="person-outline" size={normalize(14)} color={lightTheme.textSecondary} />
                        <Text style={styles.metaText}>{item.profiles.full_name}</Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <Ionicons name="people-outline" size={normalize(14)} color={lightTheme.textSecondary} />
                      <Text style={styles.metaText}>
                        {enrolledCount}/{item.max_students}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            }}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cohortName: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
