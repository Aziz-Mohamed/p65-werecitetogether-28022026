import type {
  UserRole,
  ProgramCategory,
  EnrollmentStatus,
  CohortStatus,
  SessionStatus,
  QueueStatus,
  WaitlistStatus,
  AgeRange,
  Gender,
  NotificationCategory,
} from '@/types/common.types';

// ─── App ────────────────────────────────────────────────────────────────────

export const APP_NAME = 'WeReciteTogether';
export const APP_NAME_AR = 'نتلو معاً';

// ─── Roles ──────────────────────────────────────────────────────────────────

export const ROLES: readonly UserRole[] = [
  'student',
  'teacher',
  'supervisor',
  'program_admin',
  'master_admin',
] as const;

export const PROGRAM_SCOPED_ROLES: readonly UserRole[] = [
  'teacher',
  'supervisor',
  'program_admin',
] as const;

// ─── Program Categories ─────────────────────────────────────────────────────

export const PROGRAM_CATEGORIES: readonly ProgramCategory[] = [
  'free',
  'structured',
  'mixed',
] as const;

// ─── Enrollment Statuses ────────────────────────────────────────────────────

export const ENROLLMENT_STATUSES: readonly EnrollmentStatus[] = [
  'pending',
  'active',
  'dropped',
  'completed',
  'rejected',
] as const;

// ─── Cohort Statuses ────────────────────────────────────────────────────────

export const COHORT_STATUSES: readonly CohortStatus[] = [
  'draft',
  'open',
  'closed',
  'in_progress',
  'completed',
  'archived',
] as const;

// ─── Session Statuses ───────────────────────────────────────────────────────

export const SESSION_STATUSES: readonly SessionStatus[] = [
  'draft',
  'in_progress',
  'completed',
  'cancelled',
] as const;

// ─── Queue Statuses ─────────────────────────────────────────────────────────

export const QUEUE_STATUSES: readonly QueueStatus[] = [
  'waiting',
  'notified',
  'claimed',
  'expired',
  'left',
] as const;

// ─── Waitlist Statuses ──────────────────────────────────────────────────────

export const WAITLIST_STATUSES: readonly WaitlistStatus[] = [
  'waiting',
  'offered',
  'enrolled',
  'expired',
  'left',
] as const;

// ─── Demographics ───────────────────────────────────────────────────────────

export const GENDERS: readonly Gender[] = ['male', 'female'] as const;

export const AGE_RANGES: readonly AgeRange[] = [
  'under_13',
  '13_17',
  '18_24',
  '25_34',
  '35_49',
  '50_plus',
] as const;

// ─── Notification Categories ────────────────────────────────────────────────

export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  'enrollment',
  'session_reminder',
  'queue',
  'rating',
  'voice_memo',
  'waitlist',
  'quality_alert',
  'cohort',
  'system',
  'general',
] as const;

// ─── Scoring ────────────────────────────────────────────────────────────────

export const SCORE_RANGE = {
  min: 0,
  max: 5,
} as const;

// ─── Teacher Ratings ────────────────────────────────────────────────────────

export const RATING_TAGS = {
  positive: [
    'patient',
    'clear_explanation',
    'encouraging',
    'excellent_tajweed',
    'well_prepared',
    'good_pace',
  ],
  constructive: [
    'session_felt_rushed',
    'hard_to_understand',
    'frequently_late',
    'disorganized',
    'not_encouraging',
    'too_strict',
  ],
} as const;

export const MIN_REVIEWS_FOR_PUBLIC_RATING = 5;
export const RATING_WARNING_THRESHOLD = 3.5;
export const RATING_WINDOW_HOURS = 48;

// ─── Queue & Limits ─────────────────────────────────────────────────────────

export const QUEUE_CLAIM_MINUTES = 3;
export const QUEUE_EXPIRY_HOURS = 2;
export const DEFAULT_DAILY_SESSION_LIMIT = 2;
export const DEFAULT_MAX_CONCURRENT_STUDENTS = 1;

// ─── Voice Memos ────────────────────────────────────────────────────────────

export const VOICE_MEMO_MAX_DURATION_SECONDS = 120;
export const VOICE_MEMO_MAX_SIZE_BYTES = 2097152; // 2MB
export const VOICE_MEMO_EXPIRY_DAYS = 30;
