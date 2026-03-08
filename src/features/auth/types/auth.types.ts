import type { Tables } from '@/types/database.types';
import type { UserRole } from '@/types/common.types';

// ─── OAuth Types ─────────────────────────────────────────────────────────────

export type OAuthProvider = 'google' | 'apple';

export interface OAuthLoginResult {
  provider: OAuthProvider;
  userId: string;
  email: string;
  isNewUser: boolean;
}

// ─── Dev Login Types ─────────────────────────────────────────────────────────

export interface DevLoginInput {
  role: UserRole;
}

// ─── Role Update Types ───────────────────────────────────────────────────────

export interface UpdateRoleInput {
  action: 'update-role';
  userId: string;
  role: UserRole;
}

export interface UpdateRoleResponse {
  profile: {
    id: string;
    role: string;
    full_name: string;
  };
}

// ─── Legacy Types (backward compat — used by admin create screens) ───────────

/** @deprecated Member creation via password is removed (FR-022). */
export interface CreateMemberInput {
  fullName: string;
  username: string;
  password: string;
  role: 'student' | 'teacher';
  classId?: string;
  dateOfBirth?: string;
  nameLocalized?: Record<string, string>;
}

/** @deprecated Member creation via password is removed (FR-022). */
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
    current_level: number;
  };
}

// ─── Error Type ──────────────────────────────────────────────────────────────

export type OAuthErrorCategory = 'network' | 'cancelled' | 'provider' | 'unknown';

export interface AuthError {
  message: string;
  code?: string;
  category?: OAuthErrorCategory;
}

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface AuthResult<T = void> {
  data?: T;
  error?: AuthError;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export type Profile = Tables<'profiles'>;
