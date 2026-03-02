import type { Tables, TablesInsert } from '@/types/database.types';

/** Base session row from the database */
type Session = Tables<'sessions'>;

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
/** Input for creating a new session */
export interface CreateSessionInput {
  student_id: string;
  teacher_id: string;
  class_id?: string | null;
  session_date?: string;
  memorization_score?: number | null;
  tajweed_score?: number | null;
  recitation_quality?: number | null;
  notes?: string | null;
  scheduled_session_id?: string | null;
}

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
/** Filters for querying sessions */
export interface SessionFilters {
  studentId?: string;
  teacherId?: string;
  classId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
/** Session with all related details expanded */
export interface SessionWithDetails extends Session {
  student: Tables<'profiles'>;
  teacher: Tables<'profiles'>;
  class: Tables<'classes'> | null;
}

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
/** Input for creating a teacher check-in */
export interface CreateCheckinInput {
  teacher_id: string;
  class_id?: string | null;
  date?: string;
}

/** @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5. */
/** Teacher check-in with profile details */
export interface CheckinWithTeacher extends Tables<'teacher_checkins'> {
  teacher: Tables<'profiles'>;
  class: Tables<'classes'> | null;
}
