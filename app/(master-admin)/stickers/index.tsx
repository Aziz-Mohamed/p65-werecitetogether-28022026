import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useStickers } from '@/features/gamification/hooks/useStickers';
import { useRTL } from '@/hooks/useRTL';
import { getStickerImageUrl } from '@/lib/storage';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { normalize } from '@/theme/normalize';
import { TIER_COLORS } from '@/features/gamification/components/StickerGrid';
import { StickerDetailSheet } from '@/features/gamification/components/StickerDetailSheet';
import type { StickerTier, StickerCollectionItem } from '@/features/gamification/types/gamification.types';

// ─── Sticker Catalog Screen ──────────────────────────────────────────────────

export default function StickerCatalogScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRTL } = useRTL();

  const { data: stickers = [], isLoading, error, refetch } = useStickers();
  const [selectedSticker, setSelectedSticker] = useState<StickerCollectionItem | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Text style={styles.title}>{t('admin.stickers.title')}</Text>
          <View style={{ width: normalize(70) }} />
        </View>

        <Text style={styles.subtitle}>
          {t('admin.stickers.catalogCount', { count: stickers.length })}
        </Text>

        {stickers.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title={t('admin.stickers.emptyTitle')}
            description={t('admin.stickers.emptyDescription')}
          />
        ) : (
          <View style={styles.grid}>
            {stickers.map((item) => {
              const tier = item.tier as StickerTier;
              const name = isRTL ? item.name_ar : item.name_en;
              const imageUrl = getStickerImageUrl(item.image_path);
              const tierColor = TIER_COLORS[tier] ?? colors.neutral[400];

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => setSelectedSticker({
                    sticker: item,
                    count: 0,
                    firstAwardedAt: '',
                    lastAwardedAt: '',
                    lastAwardedBy: null,
                    isNew: false,
                    awards: [],
                  })}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.stickerImage}
                    contentFit="contain"
                    cachePolicy="disk"
                    transition={300}
                  />
                  <View style={styles.cardFooter}>
                    <Text style={styles.stickerName} numberOfLines={1}>{name}</Text>
                    <View style={styles.tierBadge}>
                      <Text style={[styles.tierText, { color: tierColor }]}>
                        {t(`student.stickers.tier.${tier}`)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <StickerDetailSheet
        item={selectedSticker}
        onClose={() => setSelectedSticker(null)}
      />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    borderRadius: normalize(16),
    backgroundColor: colors.white,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  stickerImage: {
    width: '100%',
    aspectRatio: 1,
  },
  cardFooter: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: normalize(4),
  },
  stickerName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.semiBold,
  },
  tierBadge: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(8),
    backgroundColor: colors.neutral[50],
  },
  tierText: {
    fontSize: normalize(10),
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
});
