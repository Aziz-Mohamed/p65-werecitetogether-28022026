import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StatusBadge } from '@/features/certifications/components/StatusBadge';
import { RecommendationForm } from '@/features/certifications/components/RecommendationForm';
import { certificationsService } from '@/features/certifications/services/certifications.service';
import type { CertificationStatus } from '@/features/certifications/types/certifications.types';

export default function TeacherCertificationDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: cert, isLoading, isError, refetch } = useQuery({
    queryKey: ['certifications', 'detail', id],
    queryFn: async () => {
      const { data, error } = await certificationsService.getCertificationById(id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const resubmit = useMutation({
    mutationKey: ['certifications', 'resubmit'],
    mutationFn: (input: { notes?: string; title?: string; titleAr?: string }) =>
      certificationsService.resubmit({
        certificationId: id!,
        notes: input.notes,
        title: input.title,
        titleAr: input.titleAr,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      Alert.alert(t('common.success'), t('certifications.form.resubmitSuccess'));
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
  });

  if (isLoading) return <Screen><Text style={styles.loading}>{t('common.loading')}</Text></Screen>;
  if (isError || !cert) return <Screen><ErrorState onRetry={refetch} /></Screen>;

  const isReturned = cert.status === 'returned';
  const student = cert.student as { full_name: string } | null;
  const program = cert.program as { name: string } | null;
  const track = cert.track as { name: string } | null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{cert.title}</Text>
          <StatusBadge status={cert.status as CertificationStatus} />
        </View>

        <InfoRow label={t('certifications.detail.student')} value={student?.full_name} />
        <InfoRow label={t('certifications.detail.program')} value={program?.name} />
        {track && <InfoRow label={t('certifications.detail.track')} value={track.name} />}
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

        {isReturned && (
          <View style={styles.resubmitSection}>
            <Text style={styles.sectionTitle}>{t('certifications.form.resubmitTitle')}</Text>
            <RecommendationForm
              onSubmit={(values) => resubmit.mutate({
                title: values.title,
                titleAr: values.titleAr,
                notes: values.notes,
              })}
              isLoading={resubmit.isPending}
              submitLabel={t('certifications.form.resubmit')}
              defaultValues={{
                type: cert.type as 'ijazah' | 'graduation' | 'completion',
                title: cert.title,
                titleAr: cert.title_ar ?? '',
                notes: cert.notes ?? '',
              }}
            />
          </View>
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
  resubmitSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBottom: spacing.sm,
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
