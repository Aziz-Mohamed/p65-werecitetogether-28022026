import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { MutoonProgressCard } from '@/features/mutoon/components/MutoonProgressCard';
import { useMyMutoonProgress } from '@/features/mutoon/hooks/useMutoonProgress';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function MutoonProgressScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id);

  const { data: progress = [], isLoading, error, refetch } = useMyMutoonProgress(programId, userId);

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
    <Screen>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="arrow-back" size={normalize(24)} color={lightTheme.text} />
      </Pressable>

      <Text style={styles.title}>{t('mutoon.title')}</Text>

      {progress.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="book-outline"
            title={t('mutoon.empty')}
            description={t('mutoon.emptyDesc')}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {progress.map((item) => (
            <MutoonProgressCard key={item.id} progress={item} />
          ))}
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
});
