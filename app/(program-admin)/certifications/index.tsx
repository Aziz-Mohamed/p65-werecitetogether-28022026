import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import {
  useCertificationRequests,
  useIssueCertification,
} from '@/features/certifications/hooks/useCertificationRequests';
import { CertificationRequestCard } from '@/features/certifications/components/CertificationRequestCard';
import { Button } from '@/components/ui/Button';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function ProgramAdminCertificationsScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [chainOfNarration, setChainOfNarration] = useState('');

  // TODO: Get programId from context/store when program selector is implemented
  const programId = undefined as string | undefined;

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useCertificationRequests(programId, 'supervisor_approved');

  const issueMutation = useIssueCertification();

  const handleIssue = useCallback(
    (certificationId: string) => {
      if (!profile?.id) return;
      issueMutation.mutate(
        {
          certificationId,
          issuedBy: profile.id,
          chainOfNarration: chainOfNarration.trim() || undefined,
        },
        { onSuccess: () => { setIssuingId(null); setChainOfNarration(''); } },
      );
    },
    [profile?.id, chainOfNarration, issueMutation],
  );

  if (isLoading && programId) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('certifications.issue')}</Text>
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
                  showActions={issuingId !== item.id}
                  actionType="issue"
                  onIssue={() => setIssuingId(item.id)}
                />
                {issuingId === item.id ? (
                  <View style={styles.issueForm}>
                    {(item as any).type === 'ijazah' ? (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('certifications.chainOfNarration')}</Text>
                        <TextInput
                          style={[styles.textInput, styles.arabicInput]}
                          value={chainOfNarration}
                          onChangeText={setChainOfNarration}
                          placeholder={t('certifications.chainOfNarrationAr')}
                          placeholderTextColor={neutral[400]}
                          multiline
                        />
                      </View>
                    ) : null}
                    <View style={styles.issueActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => { setIssuingId(null); setChainOfNarration(''); }}
                        style={styles.actionBtn}
                        title={t('common.cancel')}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleIssue(item.id)}
                        loading={issueMutation.isPending}
                        style={styles.actionBtn}
                        title={t('certifications.issue')}
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
  issueForm: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.textStyles.label,
    color: lightTheme.text,
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
  arabicInput: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  issueActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
