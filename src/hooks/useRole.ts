import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/common.types';

interface UseRoleReturn {
  role: UserRole | null;
  isStudent: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
}

/**
 * Returns the current user's role along with boolean convenience flags.
 */
export const useRole = (): UseRoleReturn => {
  const profile = useAuthStore((state) => state.profile);
  const role = (profile?.role as UserRole) ?? null;

  return {
    role,
    isStudent: role === 'student',
    isTeacher: role === 'teacher',
    isMasterAdmin: role === 'master_admin',
  };
};
