import type { Tables } from '@/types/database.types';

// ─── Enums ──────────────────────────────────────────────────────────────────

export type GuardianRelationship =
  | 'parent'
  | 'guardian'
  | 'grandparent'
  | 'sibling'
  | 'other';

export type GuardianNotificationCategory =
  | 'attendance'
  | 'session_outcomes'
  | 'milestones';

// ─── Database Row Aliases ───────────────────────────────────────────────────

export type StudentGuardian = Tables<'student_guardians'>;
export type GuardianNotificationPreference = Tables<'guardian_notification_preferences'>;

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface AddGuardianInput {
  student_id: string;
  guardian_name: string;
  guardian_phone?: string;
  guardian_email?: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
}

export interface UpdateGuardianInput {
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  relationship?: GuardianRelationship;
  is_primary?: boolean;
}
