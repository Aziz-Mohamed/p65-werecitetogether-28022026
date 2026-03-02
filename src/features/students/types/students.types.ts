import type { Tables } from '@/types/database.types';

/** Base student row from the database */
type Student = Tables<'students'>;

/** Student record with the associated profile data */
export interface StudentWithProfile extends Student {
  profile: Tables<'profiles'>;
  currentLevel: number;
  class: Tables<'classes'> | null;
  parent: Tables<'profiles'> | null;
}

/**
 * Filters for querying students
 *
 * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
 */
export interface StudentFilters {
  classId?: string;
  parentId?: string;
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
  parent_id?: string | null;
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
  parentId?: string | null;
  isActive?: boolean;
  dateOfBirth?: string;
}
