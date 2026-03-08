import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useCohortWaitlist, usePromoteFromWaitlist } from '@/features/programs/hooks/useWaitlist';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { WaitlistEntryWithStudent } from '@/features/programs/types/programs.types';

export default function WaitlistScreen() {
  const { cohortId } = useLocalSearchParams<{ cohortId: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: waitlist = [], isLoading, error, refetch } = useCohortWaitlist(cohortId);
  const promote = usePromoteFromWaitlist(cohortId!);

  const handlePromote = () => {
    Alert.alert(
      t('programs.waitlist.promoteTitle'),
      t('programs.waitlist.promoteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => promote.mutate(),
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.labels.waitlist')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {waitlist.length > 0 && (
          <Button
            title={t('programs.waitlist.promoteNext')}
            onPress={handlePromote}
            variant="primary"
            size="sm"
            loading={promote.isPending}
            icon={<Ionicons name="arrow-up-circle-outline" size={normalize(16)} color="#fff" />}
          />
        )}

        {waitlist.length === 0 ? (
          <EmptyState
            icon="hourglass-outline"
            title={t('programs.waitlist.empty')}
          />
        ) : (
          <FlashList
            data={waitlist}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            renderItem={({ item }: { item: WaitlistEntryWithStudent }) => (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>#{item.position}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {item.profiles?.full_name ?? '—'}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Badge
                    label={t(`programs.waitlist.status.${item.status}`)}
                    variant={item.status === 'offered' ? 'warning' : 'default'}
                    size="sm"
                  />
                </View>
                {item.status === 'offered' && item.expires_at && (
                  <Text style={styles.expiresText}>
                    {t('programs.waitlist.expiresAt', {
                      date: new Date(item.expires_at).toLocaleString(),
                    })}
                  </Text>
                )}
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
    gap: spacing.sm,
  },
  positionBadge: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: colors.accent.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    ...typography.textStyles.bodyMedium,
    color: colors.accent.orange[600],
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  date: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  expiresText: {
    ...typography.textStyles.caption,
    color: colors.accent.orange[500],
    marginTop: spacing.xs,
  },
});
