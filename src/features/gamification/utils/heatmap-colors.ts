// Freshness-based color scale for the Quran Map heatmap.
// Uses the same color language as the revision tab:
// green (fresh) → yellow (fading) → orange (warning) → red (critical) → gray (dormant/uncertified).

import type { FreshnessState } from '../types/gamification.types';
import { primary, accent, neutral } from '@/theme/colors';

const FRESHNESS_COLORS: Record<FreshnessState, string> = {
  fresh: primary[500],
  fading: accent.yellow[500],
  warning: accent.orange[500],
  critical: accent.red[500],
  dormant: neutral[400],
  uncertified: neutral[200],
};

/**
 * Get heatmap color for a rub' based on its freshness state.
 * Pass `null` for uncertified rub'.
 */
export function getHeatMapColor(state: FreshnessState | null): string {
  if (state === null) return FRESHNESS_COLORS.uncertified;
  return FRESHNESS_COLORS[state];
}

/** Legend entries for the heatmap (freshness states) */
export const HEATMAP_LEGEND = [
  { label: 'critical', color: FRESHNESS_COLORS.critical },
  { label: 'warning', color: FRESHNESS_COLORS.warning },
  { label: 'fading', color: FRESHNESS_COLORS.fading },
  { label: 'fresh', color: FRESHNESS_COLORS.fresh },
  { label: 'dormant', color: FRESHNESS_COLORS.dormant },
] as const;
