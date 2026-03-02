import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useHimamEvents, useCreateHimamEvent } from '@/features/himam/hooks/useHimamEvents';
import { HimamEventCard } from '@/features/himam/components/HimamEventCard';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function ProgramAdminHimamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:00');

  // TODO: Get programId from context/store
  const programId = undefined as string | undefined;

  const { data: events = [], isLoading, error, refetch } = useHimamEvents(programId);
  const createMutation = useCreateHimamEvent();

  const handleCreate = useCallback(() => {
    if (!programId || !profile?.id || !eventDate) return;
    // Validate Saturday
    const date = new Date(eventDate);
    if (date.getDay() !== 6) {
      Alert.alert(t('himam.eventDateHint'));
      return;
    }
    createMutation.mutate(
      {
        input: {
          program_id: programId,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          timezone: 'Asia/Riyadh',
        },
        createdBy: profile.id,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setEventDate('');
        },
      },
    );
  }, [programId, profile?.id, eventDate, startTime, endTime, createMutation, t]);

  if (isLoading && programId) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('himam.events')}</Text>
          <Button variant="primary" size="sm" onPress={() => setShowForm(!showForm)} title={t('himam.createEvent')} />
        </View>

        {showForm ? (
          <Card variant="default" style={styles.form}>
            <TextInput
              style={styles.input}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={neutral[400]}
            />
            <Text style={styles.hint}>{t('himam.eventDateHint')}</Text>
            <Button
              variant="primary"
              onPress={handleCreate}
              loading={createMutation.isPending}
              disabled={!eventDate || !programId}
              title={t('common.create')}
            />
          </Card>
        ) : null}

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
                onPress={() => router.push(`/(program-admin)/himam/${item.id}`)}
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
  header: { paddingBlockStart: spacing.lg, paddingBlockEnd: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
  form: { gap: spacing.sm, marginBottom: spacing.base },
  input: { ...typography.textStyles.body, color: lightTheme.text, borderWidth: 1, borderColor: neutral[200], borderRadius: radius.md, padding: spacing.base },
  hint: { ...typography.textStyles.caption, color: neutral[400] },
  listContent: { paddingBottom: spacing.lg },
  separator: { height: spacing.sm },
});
