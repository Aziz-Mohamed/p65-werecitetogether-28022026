import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { colors } from '@/theme/colors';
import type { EnrollmentStatus, CohortStatus, ProgramCategory } from '../types/programs.types';

// ─── Localized Field Hook ────────────────────────────────────────────────────

/**
 * Returns the correct field value based on current locale.
 * Falls back to Arabic if English is unavailable, and vice versa.
 */
export function useLocalizedField() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const resolve = useCallback(
    (en: string | null | undefined, ar: string | null | undefined): string => {
      if (isArabic) return ar ?? en ?? '';
      return en ?? ar ?? '';
    },
    [isArabic],
  );

  return resolve;
}

// ─── Status Color Mapping ────────────────────────────────────────────────────

const enrollmentStatusColors: Record<EnrollmentStatus, string> = {
  pending: colors.secondary[500],   // amber
  active: colors.primary[500],      // green
  completed: colors.accent.blue[500],
  dropped: colors.neutral[400],
  waitlisted: colors.accent.orange[500],
};

export function getEnrollmentStatusColor(status: EnrollmentStatus): string {
  return enrollmentStatusColors[status] ?? colors.neutral[400];
}

export type EnrollmentStatusVariant = 'warning' | 'success' | 'info' | 'default' | 'error';

const enrollmentStatusVariants: Record<EnrollmentStatus, EnrollmentStatusVariant> = {
  pending: 'warning',
  active: 'success',
  completed: 'info',
  dropped: 'default',
  waitlisted: 'error',
};

export function getEnrollmentStatusVariant(status: EnrollmentStatus): EnrollmentStatusVariant {
  return enrollmentStatusVariants[status] ?? 'default';
}

// ─── Category Badge Mapping ──────────────────────────────────────────────────

type CategoryVariant = 'success' | 'info' | 'violet';

const categoryVariants: Record<ProgramCategory, CategoryVariant> = {
  free: 'success',
  structured: 'info',
  mixed: 'violet',
};

export function getCategoryVariant(category: ProgramCategory): CategoryVariant {
  return categoryVariants[category] ?? 'info';
}

// ─── Cohort Status Label ─────────────────────────────────────────────────────

const cohortStatusOrder: CohortStatus[] = [
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'archived',
];

export function getNextCohortStatus(current: CohortStatus): CohortStatus | null {
  const idx = cohortStatusOrder.indexOf(current);
  if (idx < 0 || idx >= cohortStatusOrder.length - 1) return null;
  return cohortStatusOrder[idx + 1];
}

// ─── Waitlist Position ───────────────────────────────────────────────────────

export function getWaitlistPosition(
  enrolledAt: string,
  allWaitlisted: Array<{ enrolled_at: string }>,
): number {
  const target = new Date(enrolledAt).getTime();
  const ahead = allWaitlisted.filter(
    (e) => new Date(e.enrolled_at).getTime() < target,
  ).length;
  return ahead + 1;
}

// ─── Error Code Mapping ─────────────────────────────────────────────────────

const ENROLL_ERROR_KEYS: Record<string, string> = {
  ENROLL_PROGRAM_NOT_FOUND: 'programs.errors.programNotFound',
  ENROLL_TRACK_NOT_FOUND: 'programs.errors.trackNotFound',
  ENROLL_COHORT_REQUIRED: 'programs.errors.cohortRequired',
  ENROLL_COHORT_NOT_FOUND: 'programs.errors.cohortNotFound',
  ENROLL_COHORT_CLOSED: 'programs.errors.cohortClosed',
  'Authentication required': 'programs.errors.authRequired',
  'Only students can enroll': 'programs.errors.studentsOnly',
};

export function getEnrollErrorKey(errorMessage: string): string {
  // Check for duplicate key violation (PostgreSQL 23505)
  if (errorMessage.includes('23505') || errorMessage.includes('duplicate key')) {
    return 'programs.errors.alreadyEnrolled';
  }
  return ENROLL_ERROR_KEYS[errorMessage] ?? 'common.error';
}
