import {
  getInitials,
  formatDate,
  formatSessionDate,
  formatRelativeTime,
  calculateLevel,
  getAttendanceColor,
  clamp,
} from './helpers';
import { semantic } from '@/theme/colors';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-02-26T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── getInitials ────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns two initials for two-word name', () => {
    expect(getInitials('Ahmad Ali')).toBe('AA');
  });

  it('returns one initial for single name', () => {
    expect(getInitials('Ahmad')).toBe('A');
  });

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns "?" for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('?');
  });

  it('uses first and last name for multi-word names', () => {
    expect(getInitials('Ahmad bin Ali')).toBe('AA');
  });

  it('uppercases the initials', () => {
    expect(getInitials('ahmad ali')).toBe('AA');
  });
});

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-02-26T00:00:00Z'), 'en-US');
    expect(result).toContain('2026');
    expect(result).toContain('26');
  });

  it('formats a date string (YYYY-MM-DD)', () => {
    const result = formatDate('2026-02-26', 'en-US');
    expect(result).toContain('2026');
  });

  it('formats an ISO string', () => {
    const result = formatDate('2026-02-26T10:00:00Z', 'en-US');
    expect(result).toContain('2026');
  });
});

// ─── formatSessionDate ──────────────────────────────────────────────────────

describe('formatSessionDate', () => {
  it('returns an object with date and weekday', () => {
    const result = formatSessionDate('2026-02-26', 'en');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('weekday');
    expect(typeof result.date).toBe('string');
    expect(typeof result.weekday).toBe('string');
  });
});

// ─── formatRelativeTime ─────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date('2026-02-26T10:00:00Z');
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date('2026-02-26T09:55:00Z');
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('returns singular minute', () => {
    const oneMinAgo = new Date('2026-02-26T09:59:00Z');
    expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const twoHrsAgo = new Date('2026-02-26T08:00:00Z');
    expect(formatRelativeTime(twoHrsAgo)).toBe('2 hours ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date('2026-02-23T10:00:00Z');
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns weeks ago', () => {
    const twoWeeksAgo = new Date('2026-02-12T10:00:00Z');
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns months ago', () => {
    const twoMonthsAgo = new Date('2025-12-26T10:00:00Z');
    expect(formatRelativeTime(twoMonthsAgo)).toBe('2 months ago');
  });

  it('accepts string dates', () => {
    expect(formatRelativeTime('2026-02-26T09:55:00Z')).toBe('5 minutes ago');
  });
});

// ─── calculateLevel ─────────────────────────────────────────────────────────

describe('calculateLevel', () => {
  it('returns level 1 for 0 points', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe('Beginner');
    expect(result.progress).toBe(0);
  });

  it('returns level 2 at exactly 50 points', () => {
    const result = calculateLevel(50);
    expect(result.level).toBe(2);
    expect(result.title).toBe('Seeker');
    expect(result.progress).toBe(0);
  });

  it('computes mid-level progress', () => {
    // Level 2 = 50-149 points, range = 100
    // At 100 points: (100 - 50) / (150 - 50) = 0.5
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.progress).toBe(0.5);
  });

  it('returns max level for high points', () => {
    const result = calculateLevel(3500);
    expect(result.level).toBe(10);
    expect(result.title).toBe('Quran Guardian');
    expect(result.progress).toBe(1);
  });

  it('returns max level with progress 1 for very high points', () => {
    const result = calculateLevel(99999);
    expect(result.level).toBe(10);
    expect(result.progress).toBe(1);
  });

  it('returns nextLevelPoints correctly', () => {
    const result = calculateLevel(0);
    expect(result.nextLevelPoints).toBe(50); // next level is 2 (50 points)
  });
});

// ─── getAttendanceColor ─────────────────────────────────────────────────────

describe('getAttendanceColor', () => {
  it('returns green for present', () => {
    expect(getAttendanceColor('present')).toBe(semantic.success);
  });

  it('returns red for absent', () => {
    expect(getAttendanceColor('absent')).toBe(semantic.error);
  });

  it('returns yellow for late', () => {
    expect(getAttendanceColor('late')).toBe(semantic.warning);
  });

  it('returns blue for excused', () => {
    expect(getAttendanceColor('excused')).toBe(semantic.info);
  });
});

// ─── clamp ──────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('returns boundary values exactly', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
