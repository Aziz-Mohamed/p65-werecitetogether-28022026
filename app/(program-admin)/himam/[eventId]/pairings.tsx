import React, { useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/feedback';
import { useHimamRegistrations } from '@/features/himam/hooks/useHimamRegistration';
import { supabase } from '@/lib/supabase';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProgramAdminPairingsScreen() {
  const { t } = useTranslation();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useHimamRegistrations(eventId);

  const matchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('himam-partner-matching', {
        body: { event_id: eventId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam-registrations'] });
    },
  });

  const paired = registrations.filter((r) => r.partner_id != null);
  const unmatched = registrations.filter((r) => r.status === 'registered' && r.partner_id == null);

  if (isLoading) return <LoadingState />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('himam.matching.title')}</Text>

        <Card variant="default" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.floor(paired.length / 2)}</Text>
              <Text style={styles.statLabel}>{t('himam.matching.paired', { count: Math.floor(paired.length / 2) })}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{unmatched.length}</Text>
              <Text style={styles.statLabel}>{t('himam.matching.unmatched', { count: unmatched.length })}</Text>
            </View>
          </View>

          <Button
            variant="primary"
            onPress={() => matchMutation.mutate()}
            loading={matchMutation.isPending}
            title={t('himam.matching.runMatching')}
          />
        </Card>

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
                  <Text style={styles.arrow}>↔</Text>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {(item as any).partner?.display_name ?? (item as any).partner?.full_name ?? '—'}
                  </Text>
                  <Badge variant={item.partner_id ? 'success' : 'default'} size="sm" label={item.track} />
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
  container: { gap: spacing.base, paddingVertical: spacing.base },
  title: { ...typography.textStyles.heading, color: lightTheme.text },
  statsCard: { gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.textStyles.heading, color: lightTheme.text },
  statLabel: { ...typography.textStyles.caption, color: neutral[500], marginTop: spacing.xs, textAlign: 'center' },
  listContent: { paddingBottom: spacing.lg },
  regCard: { padding: spacing.md },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentName: { ...typography.textStyles.body, color: lightTheme.text, flex: 1 },
  arrow: { ...typography.textStyles.body, color: neutral[400] },
  separator: { height: spacing.sm },
});
