import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import type { CertificationStatus } from '../types/certifications.types';
import type { UserRole } from '@/types/common.types';

interface CertificationWorkflowProps {
  status: CertificationStatus;
  userRole: UserRole;
  certificationType?: string;
  onRecommend?: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onIssue?: (chainOfNarration?: string) => void;
  onRevoke?: (reason: string) => void;
  isLoading?: boolean;
}

export function CertificationWorkflow({
  status,
  userRole,
  certificationType,
  onRecommend,
  onApprove,
  onReject,
  onIssue,
  onRevoke,
  isLoading = false,
}: CertificationWorkflowProps) {
  const { t } = useTranslation();
  const [rejectionReason, setRejectionReason] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [chainOfNarration, setChainOfNarration] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showRevokeInput, setShowRevokeInput] = useState(false);

  // Teacher: can recommend (before any certification exists)
  if (userRole === 'teacher' && onRecommend) {
    return (
      <View style={styles.container}>
        <Button variant="primary" onPress={onRecommend} loading={isLoading} title={t('certifications.recommend')} />
        <Text style={styles.hint}>{t('certifications.recommendDesc')}</Text>
      </View>
    );
  }

  // Supervisor: approve/reject recommended certifications
  if (userRole === 'supervisor' && status === 'recommended') {
    return (
      <View style={styles.container}>
        {showRejectInput ? (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder={t('certifications.rejectionReason')}
              placeholderTextColor={neutral[400]}
              multiline
            />
            <View style={styles.actions}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowRejectInput(false)}
                style={styles.actionButton}
                title={t('common.cancel')}
              />
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  if (rejectionReason.trim()) onReject?.(rejectionReason.trim());
                }}
                loading={isLoading}
                disabled={!rejectionReason.trim()}
                style={styles.actionButton}
                title={t('certifications.reject')}
              />
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              variant="primary"
              onPress={onApprove!}
              loading={isLoading}
              style={styles.actionButton}
              title={t('certifications.approve')}
            />
            <Button
              variant="danger"
              onPress={() => setShowRejectInput(true)}
              style={styles.actionButton}
              title={t('certifications.reject')}
            />
          </View>
        )}
      </View>
    );
  }

  // Program admin: issue approved certifications
  if (userRole === 'program_admin' && status === 'supervisor_approved') {
    return (
      <View style={styles.container}>
        {certificationType === 'ijazah' ? (
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
        <Button
          variant="primary"
          onPress={() => onIssue?.(chainOfNarration.trim() || undefined)}
          loading={isLoading}
          title={t('certifications.issue')}
        />
      </View>
    );
  }

  // Program admin: revoke issued certifications
  if (userRole === 'program_admin' && status === 'issued') {
    return (
      <View style={styles.container}>
        {showRevokeInput ? (
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.textInput}
              value={revocationReason}
              onChangeText={setRevocationReason}
              placeholder={t('certifications.revocationReason')}
              placeholderTextColor={neutral[400]}
              multiline
            />
            <View style={styles.actions}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowRevokeInput(false)}
                style={styles.actionButton}
                title={t('common.cancel')}
              />
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  if (revocationReason.trim()) onRevoke?.(revocationReason.trim());
                }}
                loading={isLoading}
                disabled={!revocationReason.trim()}
                style={styles.actionButton}
                title={t('certifications.revoke')}
              />
            </View>
          </View>
        ) : (
          <Button variant="danger" onPress={() => setShowRevokeInput(true)} title={t('certifications.revoke')} />
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  inputGroup: {
    gap: spacing.sm,
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
});
