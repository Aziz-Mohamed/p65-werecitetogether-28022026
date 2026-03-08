import { useAuthStore, type Profile } from '@/stores/authStore';
import type { UserRole } from '@/types/common.types';
import type { Session } from '@supabase/supabase-js';

interface UseAuthReturn {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  schoolId: string | null;
}

/**
 * Convenience hook that wraps the auth store and derives commonly needed
 * values such as the current user's role and school ID.
 */
export const useAuth = (): UseAuthReturn => {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    session,
    profile,
    isLoading,
    isAuthenticated,
    role: (profile?.role as UserRole) ?? null,
    schoolId: profile?.school_id ?? null,
  };
};
