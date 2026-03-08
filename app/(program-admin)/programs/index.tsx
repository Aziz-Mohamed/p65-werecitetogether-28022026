import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { CategoryBadge } from '@/features/programs/components/CategoryBadge';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { Badge } from '@/components/ui';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Program } from '@/features/programs/types/programs.types';

export default function ProgramAdminProgramsList() {
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();
  const { data: programs = [], isLoading, error, refetch } = usePrograms();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Text style={styles.title}>{t('programs.admin.programs')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {programs.length === 0 ? (
          <EmptyState
            icon="library-outline"
            title={t('programs.empty.programs')}
          />
        ) : (
          <FlashList
            data={programs}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            renderItem={({ item }: { item: Program }) => (
              <Card
                variant="outlined"
                style={styles.card}
                onPress={() => router.push(`/(program-admin)/programs/${item.id}`)}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.programName} numberOfLines={1}>
                      {localize(item.name, item.name_ar)}
                    </Text>
                    <CategoryBadge category={item.category} />
                  </View>
                  <Badge
                    label={item.is_active ? t('common.active') : t('common.inactive')}
                    variant={item.is_active ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </Card>
            )}
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
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  programName: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    flex: 1,
  },
});
