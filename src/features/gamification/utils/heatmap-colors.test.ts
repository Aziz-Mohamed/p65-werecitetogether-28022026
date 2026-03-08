import { getHeatMapColor, HEATMAP_LEGEND } from './heatmap-colors';
import { primary, accent, neutral } from '@/theme/colors';
import type { FreshnessState } from '../types/gamification.types';

describe('getHeatMapColor', () => {
  it.each([
    ['fresh', primary[500]],
    ['fading', accent.yellow[500]],
    ['warning', accent.orange[500]],
    ['critical', accent.red[500]],
    ['dormant', neutral[400]],
    ['uncertified', neutral[200]],
  ] as [FreshnessState, string][])('returns correct color for state "%s"', (state, expected) => {
    expect(getHeatMapColor(state)).toBe(expected);
  });

  it('returns uncertified color for null', () => {
    expect(getHeatMapColor(null)).toBe(neutral[200]);
  });
});

describe('HEATMAP_LEGEND', () => {
  it('has 5 legend entries', () => {
    expect(HEATMAP_LEGEND).toHaveLength(5);
  });

  it('each entry has label and color', () => {
    for (const entry of HEATMAP_LEGEND) {
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('color');
      expect(entry.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
