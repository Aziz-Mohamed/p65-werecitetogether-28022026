import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StatusBadge } from '@/features/certifications/components/StatusBadge';
import { ReviewActions } from '@/features/certifications/components/ReviewActions';
import { useCertificationDetail } from '@/features/certifications/hooks/useCertificationDetail';
import { useReviewCertification } from '@/features/certifications/hooks/useReviewCertification';
import type { CertificationStatus } from '@/features/certifications/types/certifications.types';

export default function SupervisorCertificationDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: cert, isLoading, isError, refetch } = useCertificationDetail(id);
  const review = useReviewCertification();

  if (isLoading) return <Screen><Text style={styles.loading}>{t('common.loading')}</Text></Screen>;
  if (isError || !cert) return <Screen><ErrorState onRetry={refetch} /></Screen>;

  const isPending = cert.status === 'recommended';

  const handleApprove = () => {
    Alert.alert(
      t('certifications.review.confirmApprove'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('certifications.review.approve'),
          onPress: () => {
            review.mutate(
              { certificationId: id!, action: 'approve' },
              {
                onSuccess: () => {
                  Alert.alert(t('common.success'), t('certifications.review.approveSuccess'));
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

  const handleReturn = (notes: string) => {
    review.mutate(
      { certificationId: id!, action: 'return', reviewNotes: notes },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('certifications.review.returnSuccess'));
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
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{cert.title}</Text>
          <StatusBadge status={cert.status as CertificationStatus} />
        </View>

        <InfoRow label={t('certifications.detail.student')} value={cert.student?.full_name} />
        <InfoRow label={t('certifications.detail.teacher')} value={cert.teacher?.full_name} />
        <InfoRow label={t('certifications.detail.program')} value={cert.program?.name} />
        {cert.track && <InfoRow label={t('certifications.detail.track')} value={cert.track.name} />}
        <InfoRow label={t('certifications.detail.type')} value={t(`certifications.types.${cert.type}`)} />
        <InfoRow label={t('certifications.detail.createdAt')} value={new Date(cert.created_at).toLocaleDateString()} />

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

        {isPending && (
          <ReviewActions
            mode="supervisor"
            onApprove={handleApprove}
            onReturn={handleReturn}
            isLoading={review.isPending}
          />
        )}
      </ScrollView>
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
  notesLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
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
