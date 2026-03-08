import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { EnrichedCertification, FreshnessState } from '../types/gamification.types';
import { FRESHNESS_DOT_COLORS, FRESHNESS_BG_COLORS } from '../utils/freshness-colors';
import { getMushafPageRange } from '@/lib/quran-metadata';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

type ViewMode = 'rub' | 'hizb' | 'juz';

export interface CertGroup {
  _type: 'group';
  id: string;
  groupNumber: number;
  juzNumber: number;
  children: EnrichedCertification[];
  worstState: FreshnessState;
  needsRevisionCount: number;
}

interface GroupRevisionSheetProps {
  group: CertGroup | null;
  viewMode: ViewMode;
  canSelfAssign: boolean;
  isAdding: boolean;
  isAlreadyInPlan: (cert: EnrichedCertification) => boolean;
  onAddToPlan: () => void;
  onClose: () => void;
}

export function GroupRevisionSheet({
  group,
  viewMode,
  canSelfAssign,
  isAdding,
  isAlreadyInPlan,
  onAddToPlan,
  onClose,
}: GroupRevisionSheetProps) {
  const { t } = useTranslation();

  if (!group) return null;

  const dotColor = FRESHNESS_DOT_COLORS[group.worstState] ?? colors.neutral[400];
  const bgColor = FRESHNESS_BG_COLORS[group.worstState] ?? colors.neutral[50];
  const divisor = viewMode === 'hizb' ? 2 : 8;

  const label = viewMode === 'juz'
    ? `${t('gamification.juz')} ${group.groupNumber}`
    : `${t('gamification.hizb')} ${group.groupNumber} ${'\u00B7'} ${t('gamification.juz')} ${group.juzNumber}`;

  const eligibleCount = group.children.filter((c) => {
    if (c.freshness.state === 'dormant') return false;
    return !isAlreadyInPlan(c);
  }).length;

  const avgFreshness = group.children.length > 0
    ? Math.round(group.children.reduce((sum, c) => sum + c.freshness.percentage, 0) / group.children.length)
    : 0;

  const nonDormantCount = group.children.filter((c) => c.freshness.state !== 'dormant').length;
  const allInPlan = eligibleCount === 0 && nonDormantCount > 0;

  const firstRub = group.children[0]?.rub_number;
  const lastRub = group.children[group.children.length - 1]?.rub_number;
  const pageRange = firstRub && lastRub ? getMushafPageRange(firstRub, lastRub) : undefined;

  return (
    <Modal visible={!!group} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{label}</Text>
            <View style={[styles.chip, { backgroundColor: bgColor }]}>
              <Text style={[styles.chipText, { color: dotColor }]}>
                {t(`gamification.freshness.${group.worstState}`)}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.info}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('student.revision.certifiedRub')}</Text>
              <Text style={styles.infoValue}>{group.children.length}/{divisor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('student.revision.needRevision')}</Text>
              <Text style={styles.infoValue}>{group.needsRevisionCount}</Text>
            </View>
            {pageRange && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('gamification.revision.mushafPage')}</Text>
                <Text style={styles.infoValue}>
                  {pageRange.startPage === pageRange.endPage
                    ? `${pageRange.startPage}`
                    : `${pageRange.startPage}-${pageRange.endPage}`}
                </Text>
              </View>
            )}
            <View style={styles.barRow}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${avgFreshness}%`, backgroundColor: dotColor },
                  ]}
                />
              </View>
              <Text style={styles.barPercent}>{avgFreshness}%</Text>
            </View>
          </View>

          {/* Action */}
          {canSelfAssign && eligibleCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}
              onPress={onAddToPlan}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Ionicons name="book-outline" size={22} color={colors.primary[500]} />
              )}
              <View style={styles.planText}>
                <Text style={styles.planLabel}>
                  {isAdding
                    ? t('student.revision.addingToPlan')
                    : `${t('student.revision.addAllToPlan')} (${eligibleCount})`}
                </Text>
              </View>
            </Pressable>
          )}

          {allInPlan && (
            <View style={[styles.planButton, styles.planDisabled]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary[500]} />
              <View style={styles.planText}>
                <Text style={[styles.planLabel, { color: colors.primary[600] }]}>
                  {t('gamification.revision.alreadyInPlan')}
                </Text>
              </View>
            </View>
          )}

          {!canSelfAssign && (
            <View style={styles.infoMessage}>
              <Ionicons name="person" size={20} color={colors.neutral[500]} />
              <Text style={styles.infoMessageText}>
                {t('gamification.revision.askTeacherDesc')}
              </Text>
            </View>
          )}

          {/* Cancel */}
          <Pressable
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: lightTheme.overlay,
    justifyContent: 'flex-end',
  },
  content: {
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
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginStart: spacing.sm,
  },
  chipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
  },
  info: {
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
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  barTrack: {
    flex: 1,
    height: normalize(6),
    backgroundColor: colors.neutral[200],
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  barPercent: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(12),
    color: colors.neutral[600],
    minWidth: normalize(32),
    textAlign: 'auto',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginBottom: spacing.lg,
  },
  planDisabled: {
    opacity: 0.8,
    borderColor: colors.primary[100],
  },
  planText: {
    flex: 1,
  },
  planLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(15),
    color: colors.primary[600],
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  infoMessageText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[600],
  },
  pressed: {
    opacity: 0.7,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[500],
  },
});
