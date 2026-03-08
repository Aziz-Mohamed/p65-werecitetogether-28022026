import type { Tables } from '@/types/database.types';

/** Complete profile view data with role-specific details */
export interface ProfileViewData {
  profile: Tables<'profiles'>;
  school: Tables<'schools'>;
  /** Present only if the profile belongs to a student */
  studentData?: {
    student: Tables<'students'>;
    currentLevel: number;
    class: Tables<'classes'> | null;
    currentStreak: number;
  };
  /** Present only if the profile belongs to a teacher */
  teacherData?: {
    classes: Tables<'classes'>[];
    totalStudents: number;
  };
  /** Present only if the profile belongs to a parent */
  parentData?: {
    children: Array<{
      profile: Tables<'profiles'>;
      student: Tables<'students'>;
    }>;
  };
}

/** Input for updating a user's profile */
export interface UpdateProfileInput {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_language?: string;
  username?: string | null;
}
