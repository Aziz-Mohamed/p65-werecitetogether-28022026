import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import {
  useTrackMutoonProgress,
  useUpdateMutoonProgress,
  useCertifyMutoon,
} from '@/features/mutoon/hooks/useMutoonProgress';
import { useAuth } from '@/hooks/useAuth';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { MutoonProgressWithStudent, MutoonStatus } from '@/features/mutoon/types/mutoon.types';

const statusVariant: Record<MutoonStatus, 'warning' | 'success' | 'info'> = {
  in_progress: 'warning',
  completed: 'success',
  certified: 'info',
};

export default function TeacherMutoonTrackScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();

  const { data: progress = [], isLoading, error, refetch } = useTrackMutoonProgress(trackId);
  const updateProgress = useUpdateMutoonProgress();
  const certifyMutoon = useCertifyMutoon();

  const handleAdvanceLine = (item: MutoonProgressWithStudent) => {
    if (item.current_line >= item.total_lines) return;
    updateProgress.mutate({
      progressId: item.id,
      currentLine: item.current_line + 1,
    });
  };

  const handleCertify = (item: MutoonProgressWithStudent) => {
    if (!profile?.id) return;
    Alert.alert(
      t('mutoon.teacher.certifyTitle'),
      t('mutoon.teacher.certifyBody', { name: item.profiles?.full_name ?? '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () =>
            certifyMutoon.mutate({ progressId: item.id, certifiedBy: profile.id }),
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
          <Text style={styles.title}>{t('mutoon.teacher.trackProgress')}</Text>
          <View style={{ width: 60 }} />
        </View>

        {progress.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title={t('mutoon.teacher.noStudents')}
          />
        ) : (
          <FlashList
            data={progress}
            keyExtractor={(item) => item.id}
            estimatedItemSize={120}
            renderItem={({ item }: { item: MutoonProgressWithStudent }) => {
              const percentage = item.total_lines > 0
                ? Math.round((item.current_line / item.total_lines) * 100)
                : 0;

              return (
                <Card variant="outlined" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {item.profiles?.full_name ?? '—'}
                    </Text>
                    <Badge
                      label={t(`mutoon.status.${item.status}`)}
                      variant={statusVariant[item.status]}
                      size="sm"
                    />
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(percentage, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {item.current_line}/{item.total_lines}
                    </Text>
                  </View>

                  {/* Actions */}
                  {item.status === 'in_progress' && (
                    <View style={styles.actions}>
                      <Button
                        title={t('mutoon.teacher.advanceLine')}
                        onPress={() => handleAdvanceLine(item)}
                        variant="primary"
                        size="sm"
                        loading={updateProgress.isPending}
                        icon={<Ionicons name="add-circle-outline" size={normalize(14)} color="#fff" />}
                      />
                    </View>
                  )}

                  {item.status === 'completed' && (
                    <View style={styles.actions}>
                      <Button
                        title={t('mutoon.teacher.certify')}
                        onPress={() => handleCertify(item)}
                        variant="primary"
                        size="sm"
                        loading={certifyMutoon.isPending}
                        icon={<Ionicons name="checkmark-circle-outline" size={normalize(14)} color="#fff" />}
                      />
                    </View>
                  )}
                </Card>
              );
            }}
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
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: normalize(8),
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: normalize(4),
  },
  progressText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    minWidth: normalize(50),
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
