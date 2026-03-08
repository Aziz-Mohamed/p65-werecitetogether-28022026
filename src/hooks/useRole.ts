import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/common.types';

interface UseRoleReturn {
  role: UserRole | null;
  isStudent: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
}

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

export const useIsTeacher = () => useRole().isTeacher;
export const useIsSupervisor = () => useRole().isSupervisor;
export const useIsProgramAdmin = () => useRole().isProgramAdmin;
export const useIsMasterAdmin = () => useRole().isMasterAdmin;
