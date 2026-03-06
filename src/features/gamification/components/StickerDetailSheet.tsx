import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRTL } from '@/hooks/useRTL';
import { getStickerImageUrl } from '@/lib/storage';
import { colors, glass } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { normalize } from '@/theme/normalize';
import { TIER_COLORS } from './StickerGrid';
import type { AwardRecord, StickerCollectionItem, StickerTier } from '../types/gamification.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StickerDetailSheetProps {
  item: StickerCollectionItem | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StickerDetailSheet({ item, onClose }: StickerDetailSheetProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const tier = item.sticker.tier as StickerTier;
  const tierColor = TIER_COLORS[tier] ?? colors.neutral[400];
  const name = isRTL ? item.sticker.name_ar : item.sticker.name_en;
  const imageUrl = getStickerImageUrl(item.sticker.image_path);
  const hasAwards = item.count > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { marginTop: insets.top + normalize(32), marginBottom: insets.bottom + normalize(32) }]}>
          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={normalize(22)} color={colors.neutral[400]} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Full-width sticker artwork */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.stickerImage}
                contentFit="contain"
                cachePolicy="disk"
              />
            </View>

            {/* Name */}
            <Text style={styles.stickerName}>{name}</Text>

            {/* Tier badge + program label */}
            <View style={styles.badgeRow}>
              <View style={styles.tierBadge}>
                <Text style={[styles.tierLabel, { color: tierColor }]}>
                  {t(`student.stickers.tier.${tier}`)}
                </Text>
              </View>
              {(item.sticker as Record<string, unknown>).program_id && (
                <View style={styles.programBadge}>
                  <Text style={styles.programLabel}>
                    {isRTL
                      ? ((item.sticker as Record<string, unknown>).programs as { name_ar?: string })?.name_ar
                      : ((item.sticker as Record<string, unknown>).programs as { name?: string })?.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats summary */}
            {hasAwards && (
              <View style={styles.statsContainer}>
                <StatItem
                  label={t('student.stickers.detail.timesEarned')}
                  value={`${item.count}x`}
                />
                <View style={styles.statDivider} />
                <StatItem
                  label={t('student.stickers.detail.firstEarned')}
                  value={formatDate(item.firstAwardedAt)}
                />
              </View>
            )}

            {/* Award history */}
            {item.awards.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>
                  {t('student.stickers.detail.awardHistory')}
                </Text>
                {item.awards.map((award, index) => (
                  <AwardCard
                    key={award.id}
                    award={award}
                    index={index}
                    total={item.awards.length}
                    formatDate={formatDate}
                    isRTL={isRTL}
                    t={t}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Award Card ───────────────────────────────────────────────────────────────

function AwardCard({
  award,
  index,
  total,
  formatDate,
  isRTL,
  t,
}: {
  award: AwardRecord;
  index: number;
  total: number;
  formatDate: (d: string) => string;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  const awardNumber = total - index;

  return (
    <View style={styles.awardCard}>
      <View style={styles.awardHeader}>
        <View style={styles.awardNumber}>
          <Text style={styles.awardNumberText}>#{awardNumber}</Text>
        </View>
        <Text style={styles.awardDate}>{formatDate(award.awardedAt)}</Text>
      </View>

      {award.awardedBy && (
        <View style={styles.awardRow}>
          <Ionicons name="person-outline" size={normalize(14)} color={colors.neutral[400]} />
          <Text style={styles.awardLabel}>{t('student.stickers.detail.awardedBy')}</Text>
          <Text style={styles.awardValue}>{award.awardedBy}</Text>
        </View>
      )}

      {award.reason && (
        <View style={styles.reasonContainer}>
          <Ionicons name="chatbubble-outline" size={normalize(14)} color={colors.neutral[400]} />
          <Text style={styles.reasonText}>{award.reason}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: glass.black.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    maxHeight: '90%',
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    end: spacing.md,
    zIndex: 1,
    padding: spacing.xs,
    backgroundColor: colors.neutral[50],
    borderRadius: normalize(16),
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  // ─── Image ──────────────────────────────────────────
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stickerImage: {
    width: '85%',
    height: '85%',
  },

  // ─── Name + Badges ─────────────────────────────────
  stickerName: {
    ...typography.textStyles.heading,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tierBadge: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(5),
    borderRadius: normalize(12),
    backgroundColor: colors.neutral[50],
  },
  tierLabel: {
    fontSize: normalize(12),
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  programBadge: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(5),
    borderRadius: normalize(12),
    backgroundColor: colors.accent.teal[50],
  },
  programLabel: {
    fontSize: normalize(12),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.accent.teal[700],
  },
  // ─── Stats ─────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: normalize(2),
  },
  statValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: normalize(11),
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: normalize(30),
    backgroundColor: colors.neutral[200],
  },

  // ─── Award History ─────────────────────────────────
  historySection: {
    width: '100%',
  },
  historyTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  awardCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: normalize(8),
  },
  awardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  awardNumber: {
    backgroundColor: colors.neutral[200],
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(8),
  },
  awardNumberText: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral[600],
  },
  awardDate: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semiBold,
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  awardLabel: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  awardValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semiBold,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: normalize(6),
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  reasonText: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    flex: 1,
    fontStyle: 'italic',
  },
});
