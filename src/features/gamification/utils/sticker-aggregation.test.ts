import { aggregateStickerCollection } from './sticker-aggregation';
import type { AwardedSticker } from '../types/gamification.types';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeSticker(overrides: Partial<AwardedSticker> = {}): AwardedSticker {
  return {
    id: 'as-1',
    sticker_id: 'stk-1',
    awarded_at: '2025-01-15T10:00:00Z',
    awarded_by: 'teacher-1',
    reason: null,
    is_new: false,
    stickers: {
      id: 'stk-1',
      name_ar: 'نجمة ذهبية',
      name_en: 'Gold Star',
      tier: 'gold',
      image_path: '/stickers/gold-star.png',
    },
    profiles: {
      full_name: 'Teacher One',
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('aggregateStickerCollection', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateStickerCollection([])).toEqual([]);
  });

  it('creates a single collection item for one sticker', () => {
    const stickers = [makeSticker()];
    const result = aggregateStickerCollection(stickers);

    expect(result).toHaveLength(1);
    expect(result[0].sticker.id).toBe('stk-1');
    expect(result[0].sticker.name_en).toBe('Gold Star');
    expect(result[0].count).toBe(1);
    expect(result[0].firstAwardedAt).toBe('2025-01-15T10:00:00Z');
    expect(result[0].lastAwardedAt).toBe('2025-01-15T10:00:00Z');
    expect(result[0].lastAwardedBy).toBe('Teacher One');
    expect(result[0].isNew).toBe(false);
    expect(result[0].awards).toHaveLength(1);
  });

  it('groups multiple awards of the same sticker', () => {
    const stickers = [
      makeSticker({ id: 'as-2', awarded_at: '2025-02-01T10:00:00Z' }),
      makeSticker({ id: 'as-1', awarded_at: '2025-01-15T10:00:00Z' }),
    ];

    const result = aggregateStickerCollection(stickers);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
    // Most recent first in the input → lastAwardedAt is the first item
    expect(result[0].lastAwardedAt).toBe('2025-02-01T10:00:00Z');
    expect(result[0].firstAwardedAt).toBe('2025-01-15T10:00:00Z');
    expect(result[0].awards).toHaveLength(2);
  });

  it('keeps different stickers as separate collection items', () => {
    const stickers = [
      makeSticker({ id: 'as-1', sticker_id: 'stk-1' }),
      makeSticker({
        id: 'as-2',
        sticker_id: 'stk-2',
        stickers: {
          id: 'stk-2',
          name_ar: 'نجمة فضية',
          name_en: 'Silver Star',
          tier: 'silver',
          image_path: '/stickers/silver-star.png',
        },
      }),
    ];

    const result = aggregateStickerCollection(stickers);

    expect(result).toHaveLength(2);
    expect(result[0].sticker.id).toBe('stk-1');
    expect(result[1].sticker.id).toBe('stk-2');
  });

  it('propagates is_new flag when any award is new', () => {
    const stickers = [
      makeSticker({ id: 'as-2', is_new: true }),
      makeSticker({ id: 'as-1', is_new: false }),
    ];

    const result = aggregateStickerCollection(stickers);

    expect(result[0].isNew).toBe(true);
  });

  it('sets isNew to false when no awards are new', () => {
    const stickers = [
      makeSticker({ id: 'as-2', is_new: false }),
      makeSticker({ id: 'as-1', is_new: false }),
    ];

    const result = aggregateStickerCollection(stickers);

    expect(result[0].isNew).toBe(false);
  });

  it('skips stickers with null sticker details', () => {
    const stickers = [makeSticker({ stickers: null })];

    const result = aggregateStickerCollection(stickers);

    expect(result).toHaveLength(0);
  });

  it('builds award records with correct fields', () => {
    const stickers = [
      makeSticker({
        id: 'as-1',
        reason: 'Excellent recitation',
        profiles: { full_name: 'Teacher One' },
      }),
    ];

    const result = aggregateStickerCollection(stickers);
    const award = result[0].awards[0];

    expect(award.id).toBe('as-1');
    expect(award.awardedAt).toBe('2025-01-15T10:00:00Z');
    expect(award.awardedBy).toBe('Teacher One');
    expect(award.reason).toBe('Excellent recitation');
  });

  it('handles null profiles in award records', () => {
    const stickers = [makeSticker({ profiles: null })];

    const result = aggregateStickerCollection(stickers);
    const award = result[0].awards[0];

    expect(award.awardedBy).toBeNull();
    expect(result[0].lastAwardedBy).toBeNull();
  });
});
