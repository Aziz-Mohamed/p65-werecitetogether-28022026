import type { Tables } from '@/types/database.types';

export type Enrollment = Tables<'enrollments'>;
export type WaitlistEntry = Tables<'program_waitlist'>;

export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'dropped'
  | 'waitlisted';

export type WaitlistStatus =
  | 'waiting'
  | 'offered'
  | 'accepted'
  | 'expired';

export interface EnrollmentWithDetails extends Enrollment {
  program?: { id: string; name: string; name_ar: string };
  track?: { id: string; name: string; name_ar: string } | null;
  cohort?: { id: string; name: string; status: string } | null;
  teacher_profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface EnrollmentWithProfile extends Enrollment {
  student_profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface EnrollInput {
  studentId: string;
  programId: string;
  trackId?: string;
  cohortId?: string;
}
