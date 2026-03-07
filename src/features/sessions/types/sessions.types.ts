import type { Tables, TablesInsert } from '@/types/database.types';

/** Base session row from the database */
type Session = Tables<'sessions'>;

/** Session status for draft workflow */
export type SessionStatus = 'draft' | 'completed';

/** Input for creating a new session */
export interface CreateSessionInput {
  student_id: string;
  teacher_id: string;
  class_id?: string | null;
  program_id?: string | null;
  session_date?: string;
  memorization_score?: number | null;
  tajweed_score?: number | null;
  recitation_quality?: number | null;
  notes?: string | null;
  scheduled_session_id?: string | null;
  status?: SessionStatus;
}

/** Input for updating a draft session */
export interface UpdateDraftInput {
  program_id?: string | null;
  student_id?: string;
  memorization_score?: number | null;
  tajweed_score?: number | null;
  recitation_quality?: number | null;
  notes?: string | null;
  status?: SessionStatus;
}

/** Filters for querying sessions */
export interface SessionFilters {
  studentId?: string;
  teacherId?: string;
  classId?: string;
  programId?: string;
  status?: SessionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** Session with all related details expanded */
export interface SessionWithDetails extends Session {
  student: Tables<'profiles'>;
  teacher: Tables<'profiles'>;
  class: Tables<'classes'> | null;
}

/** Input for creating a teacher check-in */
export interface CreateCheckinInput {
  teacher_id: string;
  class_id?: string | null;
  date?: string;
}

/** Teacher check-in with profile details */
export interface CheckinWithTeacher extends Tables<'teacher_checkins'> {
  teacher: Tables<'profiles'>;
  class: Tables<'classes'> | null;
}

/** Teacher program for session creation */
export interface TeacherProgram {
  program_id: string;
  programs: {
    id: string;
    name: string;
    name_ar: string | null;
  };
}
