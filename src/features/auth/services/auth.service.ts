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
  /**
   * Force-refresh the session and return a fresh access token.
   * Needed because supabase.functions.invoke() may hold a stale token
   * even when the REST client has auto-refreshed.
   */
  private async getFreshToken(): Promise<string> {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      if (__DEV__) {
        console.log('[AuthService] refreshSession failed:', error?.message);
      }
      throw new Error(i18n.t('auth.sessionExpired'));
    }

    if (__DEV__) {
      const exp = data.session.expires_at
        ? new Date(data.session.expires_at * 1000).toISOString()
        : 'unknown';
      console.log('[AuthService] Token refreshed, expires:', exp);
    }

    return data.session.access_token;
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
