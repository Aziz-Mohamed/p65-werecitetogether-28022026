import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ProgramCard } from '@/features/programs/components/ProgramCard';
import { EmptyProgramState } from '@/features/programs/components/EmptyProgramState';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Program } from '@/features/programs/types/programs.types';

export default function ProgramsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: programs, isLoading, error, refetch } = usePrograms();

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
    <Screen scroll={false} hasTabBar>
      <View style={styles.header}>
        <Text style={styles.title}>{t('student.tabs.programs')}</Text>
        <Button
          title={t('programs.myPrograms')}
          onPress={() => router.push('/(student)/programs/my-programs')}
          variant="ghost"
          size="sm"
        />
      </View>
      {!programs || programs.length === 0 ? (
        <EmptyProgramState />
      ) : (
        <FlashList
          data={programs}
          keyExtractor={(item) => item.id}
          estimatedItemSize={90}
          contentContainerStyle={{ padding: spacing.base }}
          renderItem={({ item }: { item: Program }) => (
            <ProgramCard
              program={item}
              onPress={() => router.push(`/(student)/programs/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
});
