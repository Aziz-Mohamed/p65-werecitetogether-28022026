import {
  FRESHNESS_DOT_COLORS,
  FRESHNESS_BG_COLORS,
  STATE_PRIORITY,
  getWorstState,
} from './freshness-colors';
import type { FreshnessState } from '../types/gamification.types';

const ALL_STATES: FreshnessState[] = [
  'fresh',
  'fading',
  'warning',
  'critical',
  'dormant',
  'uncertified',
];

describe('freshness-colors', () => {
  describe('FRESHNESS_DOT_COLORS', () => {
    it('has an entry for every FreshnessState', () => {
      for (const state of ALL_STATES) {
        expect(FRESHNESS_DOT_COLORS[state]).toBeDefined();
        expect(typeof FRESHNESS_DOT_COLORS[state]).toBe('string');
      }
    });

    it('returns hex color strings', () => {
      for (const state of ALL_STATES) {
        expect(FRESHNESS_DOT_COLORS[state]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('FRESHNESS_BG_COLORS', () => {
    it('has an entry for every FreshnessState', () => {
      for (const state of ALL_STATES) {
        expect(FRESHNESS_BG_COLORS[state]).toBeDefined();
        expect(typeof FRESHNESS_BG_COLORS[state]).toBe('string');
      }
    });
  });

  describe('STATE_PRIORITY', () => {
    it('ranks critical as the highest priority', () => {
      expect(STATE_PRIORITY.critical).toBeGreaterThan(STATE_PRIORITY.warning);
      expect(STATE_PRIORITY.critical).toBeGreaterThan(STATE_PRIORITY.fading);
      expect(STATE_PRIORITY.critical).toBeGreaterThan(STATE_PRIORITY.fresh);
    });

    it('ranks fresh lower than fading', () => {
      expect(STATE_PRIORITY.fresh).toBeLessThan(STATE_PRIORITY.fading);
    });

    it('ranks uncertified at zero', () => {
      expect(STATE_PRIORITY.uncertified).toBe(0);
    });
  });

  describe('getWorstState', () => {
    it('returns fresh for an empty array', () => {
      expect(getWorstState([])).toBe('fresh');
    });

    it('returns the single state when given one element', () => {
      expect(getWorstState(['warning'])).toBe('warning');
    });

    it('returns critical when mixed with other states', () => {
      expect(getWorstState(['fresh', 'fading', 'critical', 'warning'])).toBe('critical');
    });

    it('returns warning over fading and fresh', () => {
      expect(getWorstState(['fresh', 'fading', 'warning'])).toBe('warning');
    });

    it('returns dormant over fading but not over warning', () => {
      expect(getWorstState(['fresh', 'fading', 'dormant'])).toBe('dormant');
      expect(getWorstState(['dormant', 'warning'])).toBe('warning');
    });

    it('ignores uncertified (priority 0)', () => {
      expect(getWorstState(['uncertified', 'fresh'])).toBe('fresh');
    });

    it('returns fresh for all-fresh input', () => {
      expect(getWorstState(['fresh', 'fresh', 'fresh'])).toBe('fresh');
    });
  });
});
