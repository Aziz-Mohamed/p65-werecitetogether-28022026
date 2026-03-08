import type { AwardedSticker, AwardRecord, StickerCollectionItem, StickerTier } from '../types/gamification.types';

/**
 * Aggregate awarded stickers into a collection grouped by sticker_id.
 * Each item shows the sticker, how many times earned, and whether any are new.
 */
export function aggregateStickerCollection(stickers: AwardedSticker[]): StickerCollectionItem[] {
  const grouped = new Map<string, { items: AwardedSticker[]; hasNew: boolean }>();

  for (const item of stickers) {
    const key = item.sticker_id;
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(item);
      if (item.is_new) existing.hasNew = true;
    } else {
      grouped.set(key, { items: [item], hasNew: item.is_new });
    }
  }

  const collection: StickerCollectionItem[] = [];

  for (const [, { items, hasNew }] of grouped) {
    const mostRecent = items[0];
    const earliest = items[items.length - 1];
    if (mostRecent.stickers) {
      const awards: AwardRecord[] = items.map((a) => ({
        id: a.id,
        awardedAt: a.awarded_at,
        awardedBy: a.profiles?.full_name ?? null,
        reason: a.reason ?? null,
      }));

      collection.push({
        sticker: {
          id: mostRecent.stickers.id,
          name_ar: mostRecent.stickers.name_ar,
          name_en: mostRecent.stickers.name_en,
          tier: mostRecent.stickers.tier as StickerTier,
          image_path: mostRecent.stickers.image_path,
          is_active: true,
          created_at: '',
        },
        count: items.length,
        firstAwardedAt: earliest.awarded_at,
        lastAwardedAt: mostRecent.awarded_at,
        lastAwardedBy: mostRecent.profiles?.full_name ?? null,
        isNew: hasNew,
        awards,
      });
    }
  }

  return collection;
}
