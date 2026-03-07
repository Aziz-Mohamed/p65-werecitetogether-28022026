import React from 'react';
import { StyleSheet, View, Text, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useCohorts } from '@/features/programs/hooks/useCohorts';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { CohortWithTeacher } from '@/features/programs/types/programs.types';

export default function ProgramCohortsScreen() {
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
          <View style={styles.headerSpacer} />
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
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: CohortWithTeacher }) => {
              const enrolledCount = item.enrollments?.[0]?.count ?? 0;
              const metaParts = [
                t(`programs.cohortStatus.${item.status}`),
                item.profiles?.full_name,
                `${enrolledCount}/${item.max_students}`,
              ].filter(Boolean);

              return (
                <Card
                  variant="default"
                  style={styles.card}
                  onPress={() =>
                    router.push(`/(master-admin)/programs/${id}/cohorts/${item.id}`)
                  }
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardContent}>
                      <Text style={styles.cohortName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {metaParts.join('  ·  ')}
                      </Text>
                    </View>
                    <Ionicons
                      name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={18}
                      color={colors.neutral[300]}
                    />
                  </View>
                </Card>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  headerSpacer: {
    width: 60,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
    gap: normalize(3),
  },
  cohortName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    fontSize: normalize(15),
  },
  metaText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[400],
    textTransform: 'capitalize',
  },
  separator: {
    height: spacing.sm,
  },
});
