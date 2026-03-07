import {
  getEnrollmentStatusColor,
  getEnrollmentStatusVariant,
  getCategoryVariant,
  getNextCohortStatus,
  getWaitlistPosition,
  getEnrollErrorKey,
} from './enrollment-helpers';
import { colors } from '@/theme/colors';

// ─── getEnrollmentStatusVariant ─────────────────────────────────────────────

describe('getEnrollmentStatusVariant', () => {
  it.each([
    ['pending', 'warning'],
    ['active', 'success'],
    ['completed', 'info'],
    ['dropped', 'default'],
    ['waitlisted', 'error'],
  ] as const)('maps "%s" to "%s"', (status, expected) => {
    expect(getEnrollmentStatusVariant(status)).toBe(expected);
  });

  it('falls back to "default" for an unknown status', () => {
    expect(getEnrollmentStatusVariant('unknown' as any)).toBe('default');
  });
});

// ─── getEnrollmentStatusColor ───────────────────────────────────────────────

describe('getEnrollmentStatusColor', () => {
  it.each([
    ['pending', colors.secondary[500]],
    ['active', colors.primary[500]],
    ['completed', colors.accent.blue[500]],
    ['dropped', colors.neutral[400]],
    ['waitlisted', colors.accent.orange[500]],
  ] as const)('returns the correct color for "%s"', (status, expected) => {
    expect(getEnrollmentStatusColor(status)).toBe(expected);
  });

  it('returns different colors for distinct statuses', () => {
    const values = [
      getEnrollmentStatusColor('pending'),
      getEnrollmentStatusColor('active'),
      getEnrollmentStatusColor('completed'),
      getEnrollmentStatusColor('waitlisted'),
    ];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('falls back to neutral[400] for an unknown status', () => {
    expect(getEnrollmentStatusColor('bogus' as any)).toBe(colors.neutral[400]);
  });
});

// ─── getCategoryVariant ─────────────────────────────────────────────────────

describe('getCategoryVariant', () => {
  it.each([
    ['free', 'success'],
    ['structured', 'info'],
    ['mixed', 'violet'],
  ] as const)('maps "%s" to "%s"', (category, expected) => {
    expect(getCategoryVariant(category)).toBe(expected);
  });

  it('falls back to "info" for an unknown category', () => {
    expect(getCategoryVariant('other' as any)).toBe('info');
  });
});

// ─── getNextCohortStatus ────────────────────────────────────────────────────

describe('getNextCohortStatus', () => {
  it.each([
    ['enrollment_open', 'enrollment_closed'],
    ['enrollment_closed', 'in_progress'],
    ['in_progress', 'completed'],
    ['completed', 'archived'],
  ] as const)('transitions "%s" to "%s"', (current, expected) => {
    expect(getNextCohortStatus(current)).toBe(expected);
  });

  it('returns null for the terminal status "archived"', () => {
    expect(getNextCohortStatus('archived')).toBeNull();
  });

  it('returns null for an invalid/unknown status', () => {
    expect(getNextCohortStatus('nonexistent' as any)).toBeNull();
  });
});

// ─── getWaitlistPosition ────────────────────────────────────────────────────

describe('getWaitlistPosition', () => {
  const waitlisted = [
    { enrolled_at: '2026-01-01T10:00:00Z' },
    { enrolled_at: '2026-01-01T11:00:00Z' },
    { enrolled_at: '2026-01-01T12:00:00Z' },
    { enrolled_at: '2026-01-01T13:00:00Z' },
  ];

  it('returns position 1 for the earliest entry (first in queue)', () => {
    expect(getWaitlistPosition('2026-01-01T10:00:00Z', waitlisted)).toBe(1);
  });

  it('returns the correct middle position', () => {
    expect(getWaitlistPosition('2026-01-01T11:00:00Z', waitlisted)).toBe(2);
    expect(getWaitlistPosition('2026-01-01T12:00:00Z', waitlisted)).toBe(3);
  });

  it('returns position equal to length for the last entry', () => {
    expect(getWaitlistPosition('2026-01-01T13:00:00Z', waitlisted)).toBe(4);
  });

  it('returns 1 for a single-item waitlist when matching', () => {
    const single = [{ enrolled_at: '2026-06-01T00:00:00Z' }];
    expect(getWaitlistPosition('2026-06-01T00:00:00Z', single)).toBe(1);
  });

  it('returns 1 for an empty waitlist (no one ahead)', () => {
    expect(getWaitlistPosition('2026-01-01T10:00:00Z', [])).toBe(1);
  });

  it('places a later entry after all existing ones', () => {
    expect(getWaitlistPosition('2026-01-02T00:00:00Z', waitlisted)).toBe(5);
  });
});

// ─── getEnrollErrorKey ──────────────────────────────────────────────────────

describe('getEnrollErrorKey', () => {
  it.each([
    ['ENROLL_PROGRAM_NOT_FOUND', 'programs.errors.programNotFound'],
    ['ENROLL_TRACK_NOT_FOUND', 'programs.errors.trackNotFound'],
    ['ENROLL_COHORT_REQUIRED', 'programs.errors.cohortRequired'],
    ['ENROLL_COHORT_NOT_FOUND', 'programs.errors.cohortNotFound'],
    ['ENROLL_COHORT_CLOSED', 'programs.errors.cohortClosed'],
    ['Authentication required', 'programs.errors.authRequired'],
    ['Only students can enroll', 'programs.errors.studentsOnly'],
  ])('maps "%s" to "%s"', (errorMessage, expected) => {
    expect(getEnrollErrorKey(errorMessage)).toBe(expected);
  });

  it('detects PostgreSQL 23505 error code', () => {
    expect(getEnrollErrorKey('violates unique constraint 23505')).toBe(
      'programs.errors.alreadyEnrolled',
    );
  });

  it('detects "duplicate key" substring', () => {
    expect(getEnrollErrorKey('duplicate key value violates unique constraint')).toBe(
      'programs.errors.alreadyEnrolled',
    );
  });

  it('detects "duplicate key" combined with 23505', () => {
    expect(getEnrollErrorKey('duplicate key value violates unique constraint (23505)')).toBe(
      'programs.errors.alreadyEnrolled',
    );
  });

  it('falls back to "common.error" for unknown error messages', () => {
    expect(getEnrollErrorKey('something went wrong')).toBe('common.error');
    expect(getEnrollErrorKey('')).toBe('common.error');
  });
});
