import React, { forwardRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { neutral } from '@/theme/colors';

interface CertificateImageProps {
  studentName: string;
  programName: string;
  trackName?: string;
  teacherName: string;
  issueDate: string;
  certificateNumber: string;
  chainOfNarration?: string | null;
  organizationName?: string;
  verificationUrl: string;
}

/**
 * Offscreen-renderable certificate image for capture via react-native-view-shot.
 * Must be wrapped in a View with collapsable={false} for capture to work.
 */
export const CertificateImage = forwardRef<View, CertificateImageProps>(
  function CertificateImage(
    {
      studentName,
      programName,
      trackName,
      teacherName,
      issueDate,
      certificateNumber,
      chainOfNarration,
      organizationName = 'WeReciteTogether',
      verificationUrl,
    },
    ref,
  ) {
    return (
      <View ref={ref} collapsable={false} style={styles.certificate}>
        {/* Border frame */}
        <View style={styles.innerFrame}>
          {/* Header */}
          <Text style={styles.orgName}>{organizationName}</Text>
          <Text style={styles.orgNameAr}>نتلو معاً</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Title */}
          <Text style={styles.certTitle}>Certificate of Achievement</Text>
          <Text style={styles.certTitleAr}>شهادة إنجاز</Text>

          {/* Awarded to */}
          <Text style={styles.awardedLabel}>This is to certify that</Text>
          <Text style={styles.studentName}>{studentName}</Text>

          {/* Details */}
          <Text style={styles.detailText}>
            has successfully completed the requirements of
          </Text>
          <Text style={styles.programName}>{programName}</Text>
          {trackName ? <Text style={styles.trackName}>{trackName}</Text> : null}

          {/* Teacher */}
          <Text style={styles.detailText}>Under the guidance of</Text>
          <Text style={styles.teacherName}>{teacherName}</Text>

          {/* Chain of Narration (Qiraat) */}
          {chainOfNarration ? (
            <View style={styles.sanadSection}>
              <Text style={styles.sanadLabel}>السند</Text>
              <Text style={styles.sanadText}>{chainOfNarration}</Text>
            </View>
          ) : null}

          {/* Bottom section */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.dateLabel}>Date of Issue</Text>
              <Text style={styles.dateValue}>{issueDate}</Text>
              <Text style={styles.certNumber}>{certificateNumber}</Text>
            </View>
            <View style={styles.qrContainer}>
              <QRCode value={verificationUrl} size={80} />
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  certificate: {
    width: 600,
    backgroundColor: '#FFFEF7',
    padding: spacing.lg,
  },
  innerFrame: {
    borderWidth: 2,
    borderColor: '#C4A962',
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A5632',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  orgNameAr: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A5632',
    marginTop: 4,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#C4A962',
    marginVertical: spacing.lg,
  },
  certTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A2A',
    letterSpacing: 1,
  },
  certTitleAr: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3A2A',
    marginTop: 4,
  },
  awardedLabel: {
    fontSize: 14,
    color: neutral[500],
    marginTop: spacing.xl,
  },
  studentName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A3A2A',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: neutral[500],
    marginTop: spacing.lg,
  },
  programName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A5632',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  trackName: {
    fontSize: 14,
    color: neutral[600],
    marginTop: 4,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A2A',
    marginTop: spacing.xs,
  },
  sanadSection: {
    marginTop: spacing.lg,
    padding: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C4A962',
    alignItems: 'center',
    width: '100%',
  },
  sanadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A5632',
    marginBottom: spacing.xs,
  },
  sanadText: {
    fontSize: 14,
    color: '#1A3A2A',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerLeft: {
    gap: 2,
  },
  dateLabel: {
    fontSize: 11,
    color: neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A2A',
  },
  certNumber: {
    fontSize: 11,
    color: neutral[400],
    marginTop: spacing.xs,
  },
  qrContainer: {
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
