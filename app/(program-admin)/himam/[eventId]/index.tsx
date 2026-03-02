import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useHimamEvent, useCancelHimamEvent } from '@/features/himam/hooks/useHimamEvents';
import { useHimamRegistrations } from '@/features/himam/hooks/useHimamRegistration';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProgramAdminEventDetailScreen() {
  const { t, i18n } = useTranslation();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const isAr = i18n.language === 'ar';

  const { data: event, isLoading: eventLoading } = useHimamEvent(eventId);
  const { data: registrations = [], isLoading: regLoading } = useHimamRegistrations(eventId);
  const cancelMutation = useCancelHimamEvent();

  if (eventLoading || regLoading) return <LoadingState />;
  if (!event) return null;

  const eventDate = new Date(event.event_date).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        {/* Event Header */}
        <Card variant="default">
          <Text style={styles.eventTitle}>{t('himam.title')}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
          <View style={styles.row}>
            <Badge variant={event.status === 'active' ? 'success' : 'warning'} size="sm" label={t(`himam.status.${event.status}`)} />
            <Text style={styles.metaText}>{registrations.length} {t('himam.registrations.title').toLowerCase()}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => router.push(`/(program-admin)/himam/${eventId}/pairings`)}
              style={styles.actionBtn}
              title={t('himam.matching.title')}
            />
            {event.status === 'upcoming' ? (
              <Button
                variant="danger"
                size="sm"
                onPress={() => cancelMutation.mutate(eventId!)}
                loading={cancelMutation.isPending}
                style={styles.actionBtn}
                title={t('himam.cancelEvent')}
              />
            ) : null}
          </View>
        </Card>

        {/* Registrations List */}
        <Text style={styles.sectionTitle}>{t('himam.registrations.title')}</Text>
        {registrations.length === 0 ? (
          <EmptyState icon="people-outline" title={t('himam.registrations.empty')} />
        ) : (
          <FlashList
            data={registrations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card variant="default" style={styles.regCard}>
                <View style={styles.regRow}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {(item as any).student?.display_name ?? (item as any).student?.full_name ?? '—'}
                  </Text>
                  <Badge variant="default" size="sm" label={item.track} />
                  <Badge
                    variant={item.status === 'completed' ? 'success' : 'default'}
                    size="sm"
                    label={t(`himam.registration.${item.status}`)}
                  />
                </View>
              </Card>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.base },
  eventTitle: { ...typography.textStyles.heading, color: lightTheme.text },
  eventDate: { ...typography.textStyles.body, color: lightTheme.textSecondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  metaText: { ...typography.textStyles.caption, color: neutral[500] },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  sectionTitle: { ...typography.textStyles.subheading, color: lightTheme.text },
  listContent: { paddingBottom: spacing.lg },
  regCard: { padding: spacing.md },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentName: { ...typography.textStyles.bodyMedium, color: lightTheme.text, flex: 1 },
  separator: { height: spacing.sm },
});
