import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import {
  useCertificationRequests,
  useReviewCertification,
} from '@/features/certifications/hooks/useCertificationRequests';
import { CertificationRequestCard } from '@/features/certifications/components/CertificationRequestCard';
import { Button } from '@/components/ui/Button';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function SupervisorCertificationsScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // TODO: Get programId from context/store when program selector is implemented
  const programId = undefined as string | undefined;

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useCertificationRequests(programId, 'recommended');

  const reviewMutation = useReviewCertification();

  const handleApprove = useCallback(
    (certificationId: string) => {
      if (!profile?.id) return;
      reviewMutation.mutate({
        certificationId,
        action: 'approve',
        supervisorId: profile.id,
      });
    },
    [profile?.id, reviewMutation],
  );

  const handleReject = useCallback(
    (certificationId: string) => {
      if (!profile?.id || !rejectionReason.trim()) return;
      reviewMutation.mutate(
        {
          certificationId,
          action: 'reject',
          supervisorId: profile.id,
          note: rejectionReason.trim(),
        },
        { onSuccess: () => { setRejectingId(null); setRejectionReason(''); } },
      );
    },
    [profile?.id, rejectionReason, reviewMutation],
  );

  if (isLoading && programId) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('certifications.review')}</Text>
        </View>

        {!programId || requests.length === 0 ? (
          <EmptyState
            icon="ribbon-outline"
            title={t('certifications.requests.empty')}
            description={t('certifications.requests.emptyDesc')}
          />
        ) : (
          <FlashList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View>
                <CertificationRequestCard
                  request={item as any}
                  showActions={rejectingId !== item.id}
                  actionType="review"
                  onApprove={() => handleApprove(item.id)}
                  onReject={() => setRejectingId(item.id)}
                />
                {rejectingId === item.id ? (
                  <View style={styles.rejectForm}>
                    <TextInput
                      style={styles.textInput}
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      placeholder={t('certifications.rejectionReason')}
                      placeholderTextColor={neutral[400]}
                      multiline
                    />
                    <View style={styles.rejectActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => { setRejectingId(null); setRejectionReason(''); }}
                        style={styles.actionBtn}
                        title={t('common.cancel')}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onPress={() => handleReject(item.id)}
                        disabled={!rejectionReason.trim()}
                        loading={reviewMutation.isPending}
                        style={styles.actionBtn}
                        title={t('certifications.reject')}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBlockStart: spacing.lg,
    paddingBlockEnd: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  rejectForm: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  textInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: neutral[200],
    borderRadius: radius.md,
    padding: spacing.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
