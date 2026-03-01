import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { CertificationRequest, CertificationStatus } from '../types/certifications.types';

const STATUS_VARIANT: Record<CertificationStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  recommended: 'warning',
  supervisor_approved: 'info',
  issued: 'success',
  rejected: 'error',
  revoked: 'error',
};

interface CertificationRequestCardProps {
  request: CertificationRequest;
  onApprove?: () => void;
  onReject?: () => void;
  onIssue?: () => void;
  onPress?: () => void;
  showActions?: boolean;
  actionType?: 'review' | 'issue';
}

export function CertificationRequestCard({
  request,
  onApprove,
  onReject,
  onIssue,
  onPress,
  showActions = false,
  actionType = 'review',
}: CertificationRequestCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const studentName = request.student?.display_name ?? request.student?.full_name;
  const teacherName = request.teacher?.full_name;

  return (
    <Card variant="default" onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={neutral[400]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.studentName} numberOfLines={1}>
            {studentName}
          </Text>
          <Text style={styles.certTitle} numberOfLines={1}>
            {isAr ? request.title_ar : request.title}
          </Text>
        </View>
        <Badge
          variant={STATUS_VARIANT[request.status as CertificationStatus] ?? 'default'}
          size="sm"
          label={t(`certifications.status.${request.status}`)}
        />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="school-outline" size={14} color={neutral[400]} />
          <Text style={styles.metaText}>
            {t(`certifications.type.${request.type}`)}
          </Text>
        </View>
        {teacherName ? (
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={neutral[400]} />
            <Text style={styles.metaText}>{teacherName}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={neutral[400]} />
          <Text style={styles.metaText}>
            {new Date(request.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </Text>
        </View>
      </View>

      {showActions ? (
        <View style={styles.actions}>
          {actionType === 'review' ? (
            <>
              <Button variant="primary" size="sm" onPress={onApprove!} style={styles.actionButton} title={t('certifications.approve')} />
              <Button variant="danger" size="sm" onPress={onReject!} style={styles.actionButton} title={t('certifications.reject')} />
            </>
          ) : (
            <Button variant="primary" size="sm" onPress={onIssue!} style={styles.actionButton} title={t('certifications.issue')} />
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  certTitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: neutral[200],
  },
  actionButton: {
    flex: 1,
  },
});
