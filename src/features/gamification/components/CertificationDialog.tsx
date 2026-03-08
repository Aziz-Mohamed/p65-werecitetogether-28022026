import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { RubReference } from '../types/gamification.types';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

interface CertificationDialogProps {
  visible: boolean;
  rubReference: RubReference | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CertificationDialog({
  visible,
  rubReference,
  onConfirm,
  onCancel,
}: CertificationDialogProps) {
  const { t } = useTranslation();

  if (!rubReference) return null;

  const surahRange =
    rubReference.start_surah === rubReference.end_surah
      ? `${t('gamification.surah')} ${rubReference.start_surah}: ${rubReference.start_ayah}–${rubReference.end_ayah}`
      : `${t('gamification.surah')} ${rubReference.start_surah}:${rubReference.start_ayah} – ${rubReference.end_surah}:${rubReference.end_ayah}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={40} color={colors.primary[500]} />
          </View>

          <Text style={styles.title}>
            {t('gamification.certifyTitle')}
          </Text>

          <View style={styles.detailsCard}>
            <DetailRow
              label={t('gamification.rub')}
              value={String(rubReference.rub_number)}
            />
            <DetailRow
              label={t('gamification.juz')}
              value={String(rubReference.juz_number)}
            />
            <DetailRow
              label={t('gamification.hizb')}
              value={String(rubReference.hizb_number)}
            />
            <DetailRow label={t('gamification.verseRange')} value={surahRange} />
          </View>

          <Text style={styles.message}>
            {t('gamification.certifyMessage')}
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={16} color={colors.white} />
              <Text style={styles.confirmLabel}>{t('gamification.certify')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: lightTheme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[500],
  },
  detailValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[800],
  },
  message: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
  },
  cancelLabel: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  confirmLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.white,
  },
});
