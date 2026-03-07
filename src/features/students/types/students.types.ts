import type { Tables } from '@/types/database.types';

/** Base student row from the database */
type Student = Tables<'students'>;

/** Guardian metadata stored in student_guardians table */
export interface StudentGuardian {
  id: string;
  guardian_name: string;
  guardian_phone: string | null;
  guardian_email: string | null;
  relationship: string;
  is_primary: boolean;
}

/** Student record with the associated profile data */
export interface StudentWithProfile extends Student {
  profile: Tables<'profiles'>;
  currentLevel: number;
  class: Tables<'classes'> | null;
}

/**
 * Filters for querying students
 *
 * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
 */
export interface StudentFilters {
  classId?: string;
  isActive?: boolean;
  searchQuery?: string;
  levelNumber?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Input for creating a new student (profile + student record)
 *
 * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
 */
export interface CreateStudentInput {
  full_name: string;
  email: string;
  password: string;
  date_of_birth?: string | null;
  class_id?: string | null;
  phone?: string | null;
  preferred_language?: string;
}

/**
 * Input for updating an existing student record
 *
 * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
 */
export interface UpdateStudentInput {
  classId?: string | null;
  isActive?: boolean;
  dateOfBirth?: string;
}
