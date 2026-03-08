import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { QRCodeDisplay } from './QRCodeDisplay';
import type { CertificationWithDetails } from '../types/certifications.types';

interface CertificateViewProps {
  certification: CertificationWithDetails;
}

export function CertificateView({ certification }: CertificateViewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.certificate}>
      <View style={styles.border}>
        {/* Header */}
        <Text style={styles.orgNameAr}>{t('certifications.certificate.orgNameAr')}</Text>
        <Text style={styles.orgName}>{t('certifications.certificate.orgName')}</Text>

        <View style={styles.divider} />

        {/* Type */}
        <Text style={styles.typeLabel}>
          {t(`certifications.types.${certification.type}`)}
        </Text>

        {/* Title */}
        {certification.title_ar && (
          <Text style={styles.titleAr}>{certification.title_ar}</Text>
        )}
        <Text style={styles.title}>{certification.title}</Text>

        <View style={styles.divider} />

        {/* Student */}
        <Text style={styles.label}>{t('certifications.detail.student')}</Text>
        <Text style={styles.value}>{certification.student?.full_name}</Text>

        {/* Program */}
        <Text style={styles.label}>{t('certifications.detail.program')}</Text>
        <Text style={styles.value}>{certification.program?.name}</Text>

        {/* Track */}
        {certification.track && (
          <>
            <Text style={styles.label}>{t('certifications.detail.track')}</Text>
            <Text style={styles.value}>{certification.track.name}</Text>
          </>
        )}

        {/* Teacher */}
        <Text style={styles.label}>{t('certifications.detail.teacher')}</Text>
        <Text style={styles.value}>{certification.teacher?.full_name}</Text>

        {/* Chain of Narration */}
        {certification.chain_of_narration && (
          <>
            <Text style={styles.label}>{t('certifications.detail.chainOfNarration')}</Text>
            <Text style={styles.chainText}>{certification.chain_of_narration}</Text>
          </>
        )}

        <View style={styles.divider} />

        {/* Issue info */}
        <View style={styles.issueRow}>
          <View style={styles.issueCol}>
            <Text style={styles.issueLabel}>{t('certifications.detail.issueDate')}</Text>
            <Text style={styles.issueValue}>
              {certification.issue_date
                ? new Date(certification.issue_date).toLocaleDateString()
                : '—'}
            </Text>
          </View>
          <View style={styles.issueCol}>
            <Text style={styles.issueLabel}>{t('certifications.detail.issuedBy')}</Text>
            <Text style={styles.issueValue}>
              {certification.issuer?.full_name ?? '—'}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        {certification.certificate_number && (
          <View style={styles.qrSection}>
            <QRCodeDisplay certificateNumber={certification.certificate_number} size={100} />
            <Text style={styles.verifyHint}>{t('certifications.student.verifyQR')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  certificate: {
    backgroundColor: '#FFFEF5',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
  },
  border: {
    borderWidth: 2,
    borderColor: colors.primary[300],
    borderRadius: 10,
    padding: spacing.xl,
    alignItems: 'center',
  },
  orgNameAr: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary[700],
    textAlign: 'center',
  },
  orgName: {
    ...typography.textStyles.subheading,
    color: colors.primary[600],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.primary[200],
    marginVertical: spacing.base,
  },
  typeLabel: {
    ...typography.textStyles.label,
    color: colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  titleAr: {
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  label: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  chainText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  issueRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  issueCol: {
    alignItems: 'center',
  },
  issueLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  issueValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontWeight: '600',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  verifyHint: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: spacing.sm,
  },
});
