import React, { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { CertificateImage } from './CertificateImage';
import { useCertificateImage } from '../hooks/useCertificateImage';
import type { CertificationDetail as CertificationDetailType } from '../types/certifications.types';

interface CertificateDetailProps {
  certification: CertificationDetailType;
  projectUrl: string;
}

export function CertificateDetail({ certification, projectUrl }: CertificateDetailProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const certificateRef = useRef<View>(null);
  const { share, isCapturing } = useCertificateImage(certificateRef);

  const verificationUrl = `${projectUrl}/functions/v1/verify-certificate/${certification.certificate_number}`;
  const programName = isAr
    ? certification.program?.name_ar
    : certification.program?.name;
  const trackName = certification.track
    ? isAr ? certification.track.name_ar : certification.track.name
    : undefined;

  return (
    <View style={styles.container}>
      {/* Certificate fields */}
      <Card variant="default">
        <View style={styles.header}>
          <Ionicons name="ribbon" size={28} color={lightTheme.primary} />
          <Text style={styles.title}>
            {isAr ? certification.title_ar : certification.title}
          </Text>
        </View>

        <View style={styles.fieldList}>
          <DetailField
            label={t('certifications.type.ijazah')}
            value={t(`certifications.type.${certification.type}`)}
          />
          {programName ? (
            <DetailField label={t('common.level')} value={programName} />
          ) : null}
          {trackName ? (
            <DetailField label={t('curriculumProgress.title')} value={trackName} />
          ) : null}
          <DetailField
            label={t('certifications.issuedBy')}
            value={
              certification.issuer?.display_name ??
              certification.issuer?.full_name ??
              '-'
            }
          />
          {certification.issue_date ? (
            <DetailField
              label={t('certifications.issueDate')}
              value={new Date(certification.issue_date).toLocaleDateString(
                isAr ? 'ar-SA' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' },
              )}
            />
          ) : null}
          {certification.certificate_number ? (
            <DetailField
              label={t('certifications.certificateNumber')}
              value={certification.certificate_number}
            />
          ) : null}
        </View>

        {/* Chain of narration for Qiraat */}
        {certification.chain_of_narration ? (
          <View style={styles.sanadSection}>
            <Text style={styles.sanadLabel}>{t('certifications.chainOfNarration')}</Text>
            <Text style={styles.sanadText}>{certification.chain_of_narration}</Text>
          </View>
        ) : null}

        {/* QR Code */}
        {certification.certificate_number ? (
          <View style={styles.qrSection}>
            <QRCode value={verificationUrl} size={120} />
            <Text style={styles.qrHint}>{t('certifications.verify')}</Text>
          </View>
        ) : null}

        {/* Revoked warning */}
        {certification.status === 'revoked' ? (
          <View style={styles.revokedBanner}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.revokedText}>
              {t('certifications.verification.revoked')}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Share button */}
      {certification.status === 'issued' && certification.certificate_number ? (
        <Button
          variant="primary"
          onPress={share}
          loading={isCapturing}
          icon={<Ionicons name="share-outline" size={20} color="white" />}
          title={t('certifications.share')}
        />
      ) : null}

      {/* Offscreen certificate image for capture */}
      <View style={styles.offscreen}>
        <CertificateImage
          ref={certificateRef}
          studentName={certification.student_id}
          programName={programName ?? ''}
          trackName={trackName}
          teacherName={
            certification.teacher?.display_name ?? certification.teacher?.full_name ?? ''
          }
          issueDate={
            certification.issue_date
              ? new Date(certification.issue_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : ''
          }
          certificateNumber={certification.certificate_number ?? ''}
          chainOfNarration={certification.chain_of_narration}
          verificationUrl={verificationUrl}
        />
      </View>
    </View>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  fieldList: {
    gap: spacing.md,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  fieldValue: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    textAlign: 'auto',
    flex: 1,
    marginStart: spacing.base,
  },
  sanadSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: neutral[200],
    gap: spacing.xs,
  },
  sanadLabel: {
    ...typography.textStyles.label,
    color: lightTheme.text,
  },
  sanadText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 24,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: neutral[200],
    gap: spacing.sm,
  },
  qrHint: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
  revokedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.base,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
  },
  revokedText: {
    ...typography.textStyles.bodyMedium,
    color: '#DC2626',
    flex: 1,
  },
  offscreen: {
    position: 'absolute',
    start: -9999,
    top: -9999,
  },
});
