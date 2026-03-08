/**
 * Tests for the dormancy branching logic embedded in useRecordRevision mutations.
 *
 * The hook embeds this computation in mutationFn:
 *   dormantDays = input.dormantSince
 *     ? (Date.now() - Date.parse(input.dormantSince)) / MS_PER_DAY
 *     : 0
 *   resetReviewCount = dormantDays >= 30 && dormantDays < 90
 *
 * We test the logic by extracting it into a helper and verifying edge cases.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Extracted from useRecordRevision.mutationFn for testing
function computeResetReviewCount(dormantSince: string | null, now: number): boolean {
  const dormantDays = dormantSince
    ? (now - Date.parse(dormantSince)) / MS_PER_DAY
    : 0;
  return dormantDays >= 30 && dormantDays < 90;
}

function computeDormantDays(dormantSince: string | null, now: number): number {
  return dormantSince
    ? (now - Date.parse(dormantSince)) / MS_PER_DAY
    : 0;
}

describe('useRecordRevision dormancy logic', () => {
  const NOW = new Date('2026-03-01T00:00:00Z').getTime();

  describe('dormantDays calculation', () => {
    it('returns 0 when dormantSince is null', () => {
      expect(computeDormantDays(null, NOW)).toBe(0);
    });

    it('computes correct days since dormancy start', () => {
      const tenDaysAgo = new Date(NOW - 10 * MS_PER_DAY).toISOString();
      expect(computeDormantDays(tenDaysAgo, NOW)).toBeCloseTo(10, 1);
    });
  });

  describe('resetReviewCount branching', () => {
    it('returns false when not dormant (null)', () => {
      expect(computeResetReviewCount(null, NOW)).toBe(false);
    });

    it('returns false when dormant < 30 days (normal good revision)', () => {
      const twentyDaysAgo = new Date(NOW - 20 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(twentyDaysAgo, NOW)).toBe(false);
    });

    it('returns true when dormant 30-89 days (reset review count)', () => {
      const thirtyDaysAgo = new Date(NOW - 30 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(thirtyDaysAgo, NOW)).toBe(true);

      const sixtyDaysAgo = new Date(NOW - 60 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(sixtyDaysAgo, NOW)).toBe(true);

      const eightyNineDaysAgo = new Date(NOW - 89 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(eightyNineDaysAgo, NOW)).toBe(true);
    });

    it('returns false when dormant >= 90 days (requires re-certification)', () => {
      const ninetyDaysAgo = new Date(NOW - 90 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(ninetyDaysAgo, NOW)).toBe(false);

      const oneHundredDaysAgo = new Date(NOW - 100 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(oneHundredDaysAgo, NOW)).toBe(false);
    });

    it('boundary: exactly 30 days → true', () => {
      const exact30 = new Date(NOW - 30 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(exact30, NOW)).toBe(true);
    });

    it('boundary: exactly 90 days → false', () => {
      const exact90 = new Date(NOW - 90 * MS_PER_DAY).toISOString();
      expect(computeResetReviewCount(exact90, NOW)).toBe(false);
    });
  });
});
