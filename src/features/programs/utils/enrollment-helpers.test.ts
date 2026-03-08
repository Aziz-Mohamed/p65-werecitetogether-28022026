import {
  getEnrollmentStatusColor,
  getEnrollmentStatusVariant,
  getCategoryVariant,
  getNextCohortStatus,
  getWaitlistPosition,
  getEnrollErrorKey,
} from './enrollment-helpers';

describe('getEnrollmentStatusColor', () => {
  it('returns a color for each enrollment status', () => {
    expect(getEnrollmentStatusColor('pending')).toBeDefined();
    expect(getEnrollmentStatusColor('active')).toBeDefined();
    expect(getEnrollmentStatusColor('completed')).toBeDefined();
    expect(getEnrollmentStatusColor('dropped')).toBeDefined();
    expect(getEnrollmentStatusColor('waitlisted')).toBeDefined();
  });

  it('returns different colors for different statuses', () => {
    const colors = [
      getEnrollmentStatusColor('pending'),
      getEnrollmentStatusColor('active'),
      getEnrollmentStatusColor('completed'),
      getEnrollmentStatusColor('waitlisted'),
    ];
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

describe('getEnrollmentStatusVariant', () => {
  it('maps each status to correct variant', () => {
    expect(getEnrollmentStatusVariant('pending')).toBe('warning');
    expect(getEnrollmentStatusVariant('active')).toBe('success');
    expect(getEnrollmentStatusVariant('completed')).toBe('info');
    expect(getEnrollmentStatusVariant('dropped')).toBe('default');
    expect(getEnrollmentStatusVariant('waitlisted')).toBe('error');
  });
});

describe('getCategoryVariant', () => {
  it('maps each category to correct variant', () => {
    expect(getCategoryVariant('free')).toBe('success');
    expect(getCategoryVariant('structured')).toBe('info');
    expect(getCategoryVariant('mixed')).toBe('violet');
  });
});

describe('getNextCohortStatus', () => {
  it('returns the next status in the lifecycle', () => {
    expect(getNextCohortStatus('enrollment_open')).toBe('enrollment_closed');
    expect(getNextCohortStatus('enrollment_closed')).toBe('in_progress');
    expect(getNextCohortStatus('in_progress')).toBe('completed');
    expect(getNextCohortStatus('completed')).toBe('archived');
  });

  it('returns null for the last status', () => {
    expect(getNextCohortStatus('archived')).toBeNull();
  });

  it('returns null for an invalid status', () => {
    expect(getNextCohortStatus('nonexistent' as any)).toBeNull();
  });
});

describe('getWaitlistPosition', () => {
  const waitlisted = [
    { enrolled_at: '2026-01-01T10:00:00Z' },
    { enrolled_at: '2026-01-01T11:00:00Z' },
    { enrolled_at: '2026-01-01T12:00:00Z' },
    { enrolled_at: '2026-01-01T13:00:00Z' },
  ];

  it('returns 1-indexed position', () => {
    expect(getWaitlistPosition('2026-01-01T10:00:00Z', waitlisted)).toBe(1);
    expect(getWaitlistPosition('2026-01-01T11:00:00Z', waitlisted)).toBe(2);
    expect(getWaitlistPosition('2026-01-01T13:00:00Z', waitlisted)).toBe(4);
  });

  it('handles empty array', () => {
    expect(getWaitlistPosition('2026-01-01T10:00:00Z', [])).toBe(1);
  });

  it('places a new entry after all existing ones', () => {
    expect(getWaitlistPosition('2026-01-02T00:00:00Z', waitlisted)).toBe(5);
  });
});

describe('getEnrollErrorKey', () => {
  it('maps known error codes', () => {
    expect(getEnrollErrorKey('ENROLL_PROGRAM_NOT_FOUND')).toBe('programs.errors.programNotFound');
    expect(getEnrollErrorKey('ENROLL_TRACK_NOT_FOUND')).toBe('programs.errors.trackNotFound');
    expect(getEnrollErrorKey('ENROLL_COHORT_REQUIRED')).toBe('programs.errors.cohortRequired');
    expect(getEnrollErrorKey('ENROLL_COHORT_NOT_FOUND')).toBe('programs.errors.cohortNotFound');
    expect(getEnrollErrorKey('ENROLL_COHORT_CLOSED')).toBe('programs.errors.cohortClosed');
    expect(getEnrollErrorKey('Authentication required')).toBe('programs.errors.authRequired');
    expect(getEnrollErrorKey('Only students can enroll')).toBe('programs.errors.studentsOnly');
  });

  it('detects PostgreSQL 23505 duplicate key violation', () => {
    expect(getEnrollErrorKey('duplicate key value violates unique constraint (23505)')).toBe(
      'programs.errors.alreadyEnrolled',
    );
  });

  it('detects "duplicate key" substring', () => {
    expect(getEnrollErrorKey('some duplicate key error')).toBe('programs.errors.alreadyEnrolled');
  });

  it('falls back to common.error for unknown errors', () => {
    expect(getEnrollErrorKey('something went wrong')).toBe('common.error');
  });
});
