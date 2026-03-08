import type { FreshnessInfo, FreshnessState } from '../types/gamification.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Maps review_count to the decay interval in days.
 * More reviews = slower decay (spaced repetition).
 */
export function getDecayInterval(reviewCount: number): number {
  if (reviewCount <= 0) return 14;
  if (reviewCount === 1) return 21;
  if (reviewCount === 2) return 30;
  if (reviewCount === 3) return 45;
  if (reviewCount <= 5) return 60;
  if (reviewCount <= 8) return 75;
  if (reviewCount <= 11) return 90;
  return 120;
}

/**
 * Computes freshness percentage and state for a single certification.
 *
 * Formula: freshness = max(0, (1 - days_elapsed / interval_days)) * 100
 * Uses Math.floor() for percentage rounding.
 */
export function computeFreshness(
  lastReviewedAt: string,
  reviewCount: number,
  dormantSince: string | null,
): FreshnessInfo {
  // Already dormant — return 0%
  if (dormantSince !== null) {
    const intervalDays = getDecayInterval(reviewCount);
    return {
      percentage: 0,
      state: 'dormant',
      daysUntilDormant: 0,
      intervalDays,
    };
  }

  const intervalDays = getDecayInterval(reviewCount);
  const daysElapsed = (Date.now() - Date.parse(lastReviewedAt)) / MS_PER_DAY;
  const rawFreshness = Math.max(0, Math.min(100, (1 - daysElapsed / intervalDays) * 100));
  const percentage = Math.floor(rawFreshness);

  return {
    percentage,
    state: freshnessToState(percentage),
    daysUntilDormant: Math.max(0, Math.ceil(intervalDays - daysElapsed)),
    intervalDays,
  };
}

/**
 * Maps a freshness percentage to a display state.
 */
export function freshnessToState(percentage: number): FreshnessState {
  if (percentage <= 0) return 'dormant';
  if (percentage < 25) return 'critical';
  if (percentage < 50) return 'warning';
  if (percentage < 75) return 'fading';
  return 'fresh';
}

/**
 * Computes the adjusted last_reviewed_at timestamp that yields 50% freshness.
 * Used when recording a "Poor" revision.
 */
export function computePoorRevisionTimestamp(intervalDays: number): string {
  const halfIntervalMs = (intervalDays / 2) * MS_PER_DAY;
  return new Date(Date.now() - halfIntervalMs).toISOString();
}
