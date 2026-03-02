import type { Tables } from '@/types/database.types';

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface LoginInput {
  username: string;
  password: string;
  schoolSlug: string;
}

export interface CreateSchoolInput {
  schoolName: string;
  adminFullName: string;
  username: string;
  password: string;
  schoolNameLocalized?: Record<string, string>;
  adminNameLocalized?: Record<string, string>;
}

export interface CreateMemberInput {
  fullName: string;
  username: string;
  password: string;
  role: 'student' | 'teacher' | 'parent';
  classId?: string;
  parentId?: string;
  dateOfBirth?: string;
  nameLocalized?: Record<string, string>;
}

export interface ResetMemberPasswordInput {
  userId: string;
  newPassword: string;
}

// ─── Response Types ─────────────────────────────────────────────────────────

export interface CreateSchoolResponse {
  school: {
    id: string;
    name: string;
    slug: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
  profile: {
    id: string;
    username: string;
    role: 'admin';
    full_name: string;
  };
}

/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
export interface CreateMemberResponse {
  profile: {
    id: string;
    username: string;
    role: string;
    full_name: string;
    school_id: string;
  };
  student?: {
    id: string;
    class_id: string | null;
    parent_id: string | null;
    current_level: number;
  };
}

// ─── Error Type ──────────────────────────────────────────────────────────────

export interface AuthError {
  message: string;
  code?: string;
}

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface AuthResult<T = void> {
  data?: T;
  error?: AuthError;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type Profile = Tables<'profiles'>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildSyntheticEmail(username: string, schoolSlug: string): string {
  return `${username}@${schoolSlug}.app`;
}
