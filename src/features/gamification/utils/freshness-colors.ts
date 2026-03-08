import type { FreshnessState } from '../types/gamification.types';
import { primary, accent, neutral } from '@/theme/colors';

/** Solid indicator colors (dots, bars, accents) */
export const FRESHNESS_DOT_COLORS: Record<FreshnessState, string> = {
  fresh: primary[500],
  fading: accent.yellow[500],
  warning: accent.orange[500],
  critical: accent.red[500],
  dormant: neutral[400],
  uncertified: neutral[300],
};

/** Light background colors (chips, pill backgrounds) */
export const FRESHNESS_BG_COLORS: Record<FreshnessState, string> = {
  fresh: primary[100],
  fading: accent.yellow[100],
  warning: accent.orange[100],
  critical: accent.red[100],
  dormant: neutral[100],
  uncertified: neutral[100],
};

/** Priority ordering for "worst state" calculations (higher = worse) */
export const STATE_PRIORITY: Record<FreshnessState, number> = {
  fresh: 1,
  fading: 2,
  dormant: 3,
  warning: 4,
  critical: 5,
  uncertified: 0,
};

/** Returns the worst freshness state from a collection of states */
export function getWorstState(states: FreshnessState[]): FreshnessState {
  let worst: FreshnessState = 'fresh';
  let worstPriority = 0;
  for (const s of states) {
    const p = STATE_PRIORITY[s] ?? 0;
    if (p > worstPriority) {
      worstPriority = p;
      worst = s;
    }
  }
  return worst;
}
