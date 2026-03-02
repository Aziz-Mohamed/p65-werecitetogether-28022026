import { semantic } from '@/theme/colors';

// ─── String Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the initials from a full name.
 * "Ahmad Ali" → "AA", "Ahmad" → "A", "" → "?"
 */
export const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

// ─── Date Helpers ───────────────────────────────────────────────────────────

/**
 * Formats a date into a human-readable locale string.
 */
export const formatDate = (
  date: Date | string,
  locale: string = 'en-US',
): string => {
  const d = typeof date === 'string' ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Splits a session date (YYYY-MM-DD) into a main date and weekday for separate styling.
 * e.g. { date: "10 Feb 2026", weekday: "Tue" } (en) or { date: "١٠ فبراير ٢٠٢٦", weekday: "الثلاثاء" } (ar)
 */
export const formatSessionDate = (
  dateStr: string,
  locale: string = 'en',
): { date: string; weekday: string } => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString(locale, { day: 'numeric' });
  const month = d.toLocaleDateString(locale, { month: 'short' });
  const year = d.toLocaleDateString(locale, { year: 'numeric' });
  return {
    date: `${day} ${month} ${year}`,
    weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
  };
};

/**
 * Returns a relative time string like "2 hours ago", "just now", etc.
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
};

// ─── Numeric Helpers ────────────────────────────────────────────────────────

/**
 * Clamps a number between min and max (inclusive).
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// ─── Session Score Helpers ──────────────────────────────────────────────────

/**
 * Maps a session score (1-10) to a semantic color.
 */
export const getScoreColor = (score: number): string => {
  if (score >= 8) return semantic.success;
  if (score >= 5) return semantic.warning;
  return semantic.error;
};
