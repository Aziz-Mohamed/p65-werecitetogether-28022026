import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Screen, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StatusBadge } from '@/features/certifications/components/StatusBadge';
import { useCertificationDetail } from '@/features/certifications/hooks/useCertificationDetail';
import { useRevokeCertification } from '@/features/certifications/hooks/useRevokeCertification';
import type { CertificationStatus } from '@/features/certifications/types/certifications.types';

export default function MasterAdminCertificationDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: cert, isLoading, isError, refetch } = useCertificationDetail(id);
  const revokeMutation = useRevokeCertification();

  const [revokeReason, setRevokeReason] = useState('');
  const revokeSheetRef = useRef<BottomSheet>(null);
  const revokeSnapPoints = useMemo(() => ['45%'], []);

  if (isLoading) return <Screen><Text style={styles.loading}>{t('common.loading')}</Text></Screen>;
  if (isError || !cert) return <Screen><ErrorState onRetry={refetch} /></Screen>;

  const isIssued = cert.status === 'issued';

  const handleRevoke = () => {
    if (!revokeReason.trim()) return;
    Alert.alert(
      t('certifications.review.confirmRevoke'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('certifications.review.revoke'),
          style: 'destructive',
          onPress: () => {
            revokeMutation.mutate(
              { certificationId: id!, revocationReason: revokeReason.trim() },
              {
                onSuccess: () => {
                  revokeSheetRef.current?.close();
                  Alert.alert(t('common.success'), t('certifications.review.revokeSuccess'));
                  router.back();
                },
                onError: (error) => {
                  const msg = (error as { message?: string })?.message ?? '';
                  const errorKey = Object.keys(t('certifications.errors', { returnObjects: true }) as Record<string, string>)
                    .find((key) => msg.includes(key));
                  Alert.alert(
                    t('common.error'),
                    errorKey ? t(`certifications.errors.${errorKey}`) : t('certifications.errors.unknown'),
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={t('certifications.detail.title')} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>{cert.title}</Text>
          <StatusBadge status={cert.status as CertificationStatus} />
        </View>

        <InfoRow label={t('certifications.detail.student')} value={cert.student?.full_name} />
        <InfoRow label={t('certifications.detail.teacher')} value={cert.teacher?.full_name} />
        {cert.reviewer && (
          <InfoRow label={t('certifications.detail.reviewer')} value={cert.reviewer.full_name} />
        )}
        {cert.issuer && (
          <InfoRow label={t('certifications.detail.issuedBy')} value={cert.issuer.full_name} />
        )}
        <InfoRow label={t('certifications.detail.program')} value={i18n.language === 'ar' ? cert.program?.name_ar : cert.program?.name} />
        {cert.track && <InfoRow label={t('certifications.detail.track')} value={i18n.language === 'ar' ? cert.track.name_ar : cert.track.name} />}
        <InfoRow label={t('certifications.detail.type')} value={t(`certifications.types.${cert.type}`)} />
        <InfoRow label={t('certifications.detail.status')} value={t(`certifications.statuses.${cert.status}`)} />
        <InfoRow label={t('certifications.detail.createdAt')} value={new Date(cert.created_at).toLocaleDateString()} />

        {cert.certificate_number && (
          <InfoRow label={t('certifications.detail.certificateNumber')} value={cert.certificate_number} />
        )}
        {cert.issue_date && (
          <InfoRow label={t('certifications.detail.issueDate')} value={new Date(cert.issue_date).toLocaleDateString()} />
        )}

        {cert.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t('certifications.form.notes')}</Text>
            <Text style={styles.notesText}>{cert.notes}</Text>
          </View>
        )}

        {cert.review_notes && (
          <View style={[styles.notesBox, styles.reviewNotesBox]}>
            <Text style={styles.notesLabel}>{t('certifications.detail.reviewNotes')}</Text>
            <Text style={styles.notesText}>{cert.review_notes}</Text>
          </View>
        )}

        {cert.chain_of_narration && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t('certifications.detail.chainOfNarration')}</Text>
            <Text style={styles.notesText}>{cert.chain_of_narration}</Text>
          </View>
        )}

        {cert.revocation_reason && (
          <View style={[styles.notesBox, styles.revokedBox]}>
            <Text style={styles.notesLabel}>{t('certifications.detail.revocationReason')}</Text>
            <Text style={styles.notesText}>{cert.revocation_reason}</Text>
            {cert.revoked_at && (
              <Text style={styles.revokedDate}>
                {t('certifications.detail.revokedAt')}: {new Date(cert.revoked_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {isIssued && (
          <View style={styles.revokeSection}>
            <Button
              title={t('certifications.review.revoke')}
              onPress={() => revokeSheetRef.current?.snapToIndex(0)}
              variant="danger"
            />
          </View>
        )}
      </ScrollView>

      <BottomSheet
        ref={revokeSheetRef}
        snapPoints={revokeSnapPoints}
        enablePanDownToClose
        index={-1}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{t('certifications.review.revoke')}</Text>
          <Text style={styles.sheetDescription}>{t('certifications.review.confirmRevoke')}</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={3}
            placeholder={t('certifications.review.revocationReasonPlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            value={revokeReason}
            onChangeText={setRevokeReason}
            textAlignVertical="top"
          />
          <View style={styles.sheetActions}>
            <Button
              title={t('common.cancel')}
              onPress={() => revokeSheetRef.current?.close()}
              variant="ghost"
            />
            <Button
              title={t('certifications.review.revoke')}
              onPress={handleRevoke}
              variant="danger"
              loading={revokeMutation.isPending}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  loading: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  notesBox: {
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  reviewNotesBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFEEBA',
  },
  revokedBox: {
    backgroundColor: '#F8D7DA',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5C6CB',
  },
  notesLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  revokedDate: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: spacing.xs,
  },
  revokeSection: {
    marginTop: spacing.xl,
  },
  sheetContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  sheetTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBottom: spacing.xs,
  },
  sheetDescription: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBottom: spacing.base,
  },
  reasonInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    backgroundColor: lightTheme.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.base,
    minHeight: 80,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  label: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  value: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'auto',
  },
});
