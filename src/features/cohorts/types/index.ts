import type { Tables } from '@/types/database.types';
import type { Json } from '@/types/database.types';

export type Cohort = Tables<'cohorts'>;

export type CohortStatus =
  | 'enrollment_open'
  | 'enrollment_closed'
  | 'in_progress'
  | 'completed'
  | 'archived';

export interface CohortWithDetails extends Cohort {
  program?: { id: string; name: string; name_ar: string };
  track?: { id: string; name: string; name_ar: string } | null;
  teacher_profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  supervisor_profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  enrollment_count?: number;
}

export interface CreateCohortInput {
  programId: string;
  name: string;
  trackId?: string;
  maxStudents?: number;
  teacherId?: string;
  supervisorId?: string;
  meetingLink?: string;
  schedule?: Json;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCohortInput {
  name?: string;
  trackId?: string;
  maxStudents?: number;
  teacherId?: string | null;
  supervisorId?: string | null;
  meetingLink?: string | null;
  schedule?: Json;
  startDate?: string | null;
  endDate?: string | null;
}
