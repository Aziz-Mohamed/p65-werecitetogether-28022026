import { useState, useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '../services/auth.service';
import type { UserRole } from '@/types/common.types';

const DEV_EMAIL_MAP: Record<UserRole, string> = {
  student: 'dev-student@test.werecitetogether.app',
  teacher: 'dev-teacher@test.werecitetogether.app',
  supervisor: 'dev-supervisor@test.werecitetogether.app',
  program_admin: 'dev-program-admin@test.werecitetogether.app',
  master_admin: 'dev-master-admin@test.werecitetogether.app',
};

const DEV_PASSWORD = 'devtest123';

interface UseDevLoginReturn {
  signInAsRole: (role: UserRole) => Promise<void>;
  isLoading: boolean;
  activeRole: UserRole | null;
  error: string | null;
}

export const useDevLogin = (): UseDevLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);

  const signInAsRole = useCallback(async (role: UserRole) => {
    if (!__DEV__) return;

    setIsLoading(true);
    setActiveRole(role);
    setError(null);

    try {
      const email = DEV_EMAIL_MAP[role];

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: DEV_PASSWORD,
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        setSession(data.session);

        // Fetch profile
        const profileResult = await authService.getProfile(data.session.user.id);
        if (profileResult.data) {
          setProfile(profileResult.data);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dev login failed';
      setError(message);
      if (__DEV__) {
        console.log('[DevLogin] Error:', message);
      }
    } finally {
      setIsLoading(false);
      setActiveRole(null);
    }
  }, [setSession, setProfile]);

  return {
    signInAsRole,
    isLoading,
    activeRole,
    error,
  };
};
