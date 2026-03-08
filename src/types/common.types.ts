// ─── User & Role Types ──────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'supervisor' | 'program_admin' | 'master_admin';

export type ProgramScopedRole = 'teacher' | 'supervisor' | 'program_admin';

// ─── Program ───────────────────────────────────────────────────────────────

export type ProgramCategory = 'free' | 'structured' | 'mixed';

export type TrackType = 'free' | 'structured';

// ─── Enrollment ────────────────────────────────────────────────────────────

export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'dropped'
  | 'completed'
  | 'rejected';

// ─── Cohort ────────────────────────────────────────────────────────────────

export type CohortStatus =
  | 'draft'
  | 'open'
  | 'closed'
  | 'in_progress'
  | 'completed'
  | 'archived';

// ─── Session ───────────────────────────────────────────────────────────────

export type SessionStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

// ─── Queue ─────────────────────────────────────────────────────────────────

export type QueueStatus = 'waiting' | 'notified' | 'claimed' | 'expired' | 'left';

// ─── Waitlist ──────────────────────────────────────────────────────────────

export type WaitlistStatus = 'waiting' | 'offered' | 'enrolled' | 'expired' | 'left';

// ─── Demographics ──────────────────────────────────────────────────────────

export type Gender = 'male' | 'female';

export type AgeRange =
  | 'under_13'
  | '13_17'
  | '18_24'
  | '25_34'
  | '35_49'
  | '50_plus';

// ─── Notifications ─────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'enrollment'
  | 'session_reminder'
  | 'queue'
  | 'queue_available'
  | 'queue_threshold'
  | 'rating'
  | 'voice_memo'
  | 'waitlist'
  | 'quality_alert'
  | 'cohort'
  | 'system'
  | 'general';

// ─── Locale ─────────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'ar';

export type Direction = 'ltr' | 'rtl';

// ─── Generic API Response Types ─────────────────────────────────────────────

export interface ServiceResult<T = void> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

// ─── Utility Types ──────────────────────────────────────────────────────────

/** Makes specific keys of T required while keeping the rest unchanged */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** Makes specific keys of T optional while keeping the rest unchanged */
export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
