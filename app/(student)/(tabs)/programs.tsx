import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { Screen } from '@/components/layout';
import { ProgramCard } from '@/features/programs/components/ProgramCard';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Program } from '@/features/programs/types';

export default function ProgramsScreen() {
  const { t } = useTranslation();
  const { data: programs, isLoading, error } = usePrograms();
  const router = useRouter();

  const handleProgramPress = (program: Program) => {
    router.push(`/(student)/program/${program.id}` as any);
  };

  return (
    <Screen scroll={false} hasTabBar>
      <View style={styles.header}>
        <Text style={styles.title}>{t('programs.allPrograms')}</Text>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
        </View>
      )}

      {programs && (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              onPress={() => handleProgramPress(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBlockStart: spacing.lg,
    paddingBlockEnd: spacing.base,
    paddingInline: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBlock: spacing['2xl'],
  },
  errorText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  separator: {
    height: spacing.md,
  },
});
