import { getPreviousDateRange } from './usePreviousPeriod';
import type { DateRange } from '../types/reports.types';

describe('getPreviousDateRange', () => {
  it('week range: Mar 2–8 → previous is Feb 23–Mar 1', () => {
    const range: DateRange = {
      startDate: '2026-03-02',
      endDate: '2026-03-08',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.end).toBe('2026-03-01');
    expect(prev.start).toBe('2026-02-23');
  });

  it('month range: Mar 1–31 → previous is Jan 30–Feb 28', () => {
    const range: DateRange = {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      granularity: 'week',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.end).toBe('2026-02-28');
    expect(prev.start).toBe('2026-01-29');
  });

  it('previous end is exactly 1 day before current start', () => {
    const range: DateRange = {
      startDate: '2026-01-15',
      endDate: '2026-01-21',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.end).toBe('2026-01-14');
  });

  it('previous duration equals current duration', () => {
    const range: DateRange = {
      startDate: '2026-01-01',
      endDate: '2026-01-15',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    const currentDays =
      (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / 86_400_000;
    const prevDays =
      (new Date(prev.end).getTime() - new Date(prev.start).getTime()) / 86_400_000;
    expect(prevDays).toBe(currentDays);
  });

  it('single-day range: previous is the single day before', () => {
    const range: DateRange = {
      startDate: '2026-03-06',
      endDate: '2026-03-06',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.start).toBe('2026-03-05');
    expect(prev.end).toBe('2026-03-05');
  });

  it('handles month boundary correctly (Jan → Dec)', () => {
    const range: DateRange = {
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.end).toBe('2025-12-31');
    expect(prev.start).toBe('2025-12-25');
  });

  it('returns dates in YYYY-MM-DD format', () => {
    const range: DateRange = {
      startDate: '2026-01-05',
      endDate: '2026-01-10',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(prev.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(prev.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('no overlap: previous end < current start', () => {
    const range: DateRange = {
      startDate: '2026-06-15',
      endDate: '2026-06-30',
      granularity: 'day',
    };
    const prev = getPreviousDateRange(range);
    expect(new Date(prev.end).getTime()).toBeLessThan(
      new Date(range.startDate).getTime(),
    );
  });
});
