import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useHimamEvents } from '@/features/himam/hooks/useHimamEvents';
import { HimamEventCard } from '@/features/himam/components/HimamEventCard';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function StudentHimamScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // TODO: Get programId from context/store
  const programId = undefined as string | undefined;

  const { data: events = [], isLoading, error, refetch } = useHimamEvents(programId);

  if (isLoading && programId) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('himam.upcomingEvents')}</Text>
        </View>

        {!programId || events.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title={t('himam.noEvents')}
            description={t('himam.noEventsDesc')}
          />
        ) : (
          <FlashList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <HimamEventCard
                event={item}
                onPress={() => router.push(`/(student)/himam/${item.id}`)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBlockStart: spacing.lg, paddingBlockEnd: spacing.base },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
  listContent: { paddingBottom: spacing.lg },
  separator: { height: spacing.sm },
});
