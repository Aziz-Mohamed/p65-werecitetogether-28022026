import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import type { RubCoverage } from '../utils/rub-coverage';
import { formatRubVerseRange, getMushafPage } from '@/lib/quran-metadata';
import { colors, lightTheme, primary, accent, semanticSurface } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

// ─── Props ──────────────────────────────────────────────────────────────────

interface RubDetailSheetProps {
  visible: boolean;
  coverage: RubCoverage | null;
  onClose: () => void;
  onCancelAssignments?: (ids: string[]) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RubDetailSheet({ visible, coverage, onClose, onCancelAssignments }: RubDetailSheetProps) {
  const { t } = useTranslation();

  if (!coverage) return null;

  const lang = i18next.language?.startsWith('ar') ? 'ar' : 'en';
  const mushafPage = getMushafPage(coverage.rubNumber);
  const verseRange = formatRubVerseRange(
    coverage.startSurah,
    coverage.startAyah,
    coverage.endSurah,
    coverage.endAyah,
    lang,
  );

  const hasUncertified = coverage.uncertifiedAyahs > 0;
  const hasCertified = coverage.memorizedAyahs > 0;
  const certifiedPct = coverage.percentage;
  const uncertifiedPct = coverage.uncertifiedPercentage;
  const totalPct = coverage.totalPercentage;

  const isFullyCovered = totalPct === 100;

  // Chip styling — green family
  const chipBg = isFullyCovered ? primary[100] : accent.blue[100];
  const chipColor = isFullyCovered ? primary[800] : accent.blue[700];

  const hasPendingAssignments = (coverage.pendingAssignmentIds?.length ?? 0) > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                {t('gamification.rub')} {coverage.rubNumber} {'\u00B7'}{' '}
                {t('gamification.juz')} {coverage.juzNumber}
              </Text>
              <Text style={styles.verseRange}>{verseRange}</Text>
            </View>
            <View style={[styles.pctChip, { backgroundColor: chipBg }]}>
              <Text style={[styles.pctChipText, { color: chipColor }]}>
                {totalPct}%
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <InfoRow
              label={t('memorization.detail.verseRange')}
              value={verseRange}
            />
            {mushafPage != null && (
              <InfoRow
                label={t('memorization.detail.mushafPage')}
                value={`${mushafPage}`}
              />
            )}

            {/* Certified ayahs (green) */}
            {hasCertified && (
              <View style={styles.infoRow}>
                <View style={styles.dotLabelRow}>
                  <View style={[styles.dot, { backgroundColor: primary[500] }]} />
                  <Text style={styles.infoLabel}>
                    {t('memorization.detail.certified')}
                  </Text>
                </View>
                <Text style={styles.infoValue}>
                  {t('memorization.detail.certifiedAyahs', { count: coverage.memorizedAyahs })}
                </Text>
              </View>
            )}

            {/* Pending certification ayahs (striped green) */}
            {hasUncertified && (
              <View style={styles.infoRow}>
                <View style={styles.dotLabelRow}>
                  <View style={[styles.dot, { backgroundColor: primary[300] }]} />
                  <Text style={styles.infoLabel}>
                    {t('memorization.detail.pendingCertification')}
                  </Text>
                </View>
                <Text style={styles.infoValue}>
                  {t('memorization.detail.pendingAyahs', { count: coverage.uncertifiedAyahs })}
                </Text>
              </View>
            )}

            <InfoRow
              label={t('memorization.detail.status')}
              value={
                isFullyCovered
                  ? t('memorization.detail.complete')
                  : t('memorization.detail.inProgress')
              }
            />

            {/* Stacked progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                {certifiedPct > 0 && (
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${certifiedPct}%`, backgroundColor: primary[500] },
                    ]}
                  />
                )}
                {uncertifiedPct > 0 && (
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uncertifiedPct}%`, backgroundColor: primary[300] },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.progressPct}>{totalPct}%</Text>
            </View>
          </View>

          {/* Cancel pending assignments */}
          {hasPendingAssignments && onCancelAssignments && (
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={() => onCancelAssignments(coverage.pendingAssignmentIds)}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLabel}>
                {t('memorization.detail.cancelPending')}
              </Text>
            </Pressable>
          )}

          {/* Close */}
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.closeLabel}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: lightTheme.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  headerLeft: {
    flex: 1,
    gap: normalize(2),
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  verseRange: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(13),
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  pctChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginStart: spacing.sm,
  },
  pctChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(13),
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  infoLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[500],
  },
  infoValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[800],
  },

  // Stacked progress bar
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: normalize(6),
    backgroundColor: colors.neutral[200],
    borderRadius: radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressPct: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(12),
    color: colors.neutral[600],
    minWidth: normalize(32),
    textAlign: 'auto',
  },

  // Cancel
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: semanticSurface.error,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  cancelLabel: {
    ...typography.textStyles.bodyMedium,
    color: accent.red[600],
  },

  // Close
  closeButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  closeLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[500],
  },
});
