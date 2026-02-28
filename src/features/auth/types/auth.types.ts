import type { Tables } from '@/types/database.types';

// ─── Profile ─────────────────────────────────────────────────────────────────

export type Profile = Tables<'profiles'>;

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface AuthResult<T = void> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
