import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type {
  UpdateRoleInput,
  UpdateRoleResponse,
  AuthResult,
  Profile,
} from '../types/auth.types';
import i18n from '@/i18n/config';

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`
  : '';

class AuthService {
  async signInWithGoogle(idToken: string): Promise<AuthResult<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      if (!data.session) {
        return { error: { message: 'No session returned' } };
      }

      return { data: data.session };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      };
    }
  }

  /**
   * Admin updates a user's role via the create-member Edge Function.
   */
  async updateRole(input: UpdateRoleInput): Promise<AuthResult<UpdateRoleResponse>> {
    try {
      const token = await this.getFreshToken();

      if (__DEV__) {
        console.log('[AuthService] updateRole called for user:', input.userId, 'to role:', input.role);
      }

      const response = await fetch(`${FUNCTIONS_URL}/create-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (__DEV__) {
        console.log('[AuthService] updateRole response status:', response.status);
      }

      if (!response.ok) {
        return {
          error: {
            message: result.error || result.message || i18n.t('admin.updateRoleFailed'),
            code: result.code,
          },
        };
      }

      return { data: result as UpdateRoleResponse };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : i18n.t('common.unexpectedError'),
        },
      };
    }
  }

  /**
   * Sign out the current user
   */
  async logout(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      return {};
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : i18n.t('common.unexpectedError'),
        },
      };
    }
  }

  /**
   * Fetch user profile from database
   */
  async getProfile(userId: string): Promise<AuthResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      if (!data) {
        return {
          error: { message: 'Profile not found' },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : i18n.t('common.unexpectedError'),
        },
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResult<Session>> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      if (!data.session) {
        return {
          error: { message: 'No active session' },
        };
      }

      return { data: data.session };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : i18n.t('common.unexpectedError'),
        },
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  }
}

export const authService = new AuthService();
