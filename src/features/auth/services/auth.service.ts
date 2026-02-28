import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { AuthResult } from '../types/auth.types';

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

  async signInWithApple(identityToken: string): Promise<AuthResult<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
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

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  }
}

export const authService = new AuthService();
