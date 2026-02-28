import { useRole } from './useRole';
import { colors } from '@/theme/colors';

/**
 * Provides a semantic theme color set based on the current user's role.
 *
 * Student       -> Indigo  (Learning & Growth)
 * Teacher       -> Violet  (Spirituality & Wisdom)
 * Supervisor    -> Rose    (Care & Oversight)
 * Program Admin -> Sky     (Management & Clarity)
 * Master Admin  -> Emerald (Platform & Trust)
 */
export const useRoleTheme = () => {
  const { isStudent, isTeacher, isSupervisor, isProgramAdmin, isMasterAdmin } = useRole();

  if (isStudent) {
    return {
      primary: colors.accent.indigo[500],
      primaryLight: colors.accent.indigo[50],
      primaryDark: colors.accent.indigo[600],
      gradient: colors.gradients.indigo,
      tag: 'indigo' as const,
    };
  }

  if (isTeacher) {
    return {
      primary: colors.accent.violet[500],
      primaryLight: colors.accent.violet[50],
      primaryDark: colors.accent.violet[600],
      gradient: colors.gradients.violet,
      tag: 'violet' as const,
    };
  }

  if (isSupervisor) {
    return {
      primary: colors.accent.rose[500],
      primaryLight: colors.accent.rose[50],
      primaryDark: colors.accent.rose[600],
      gradient: colors.gradients.rose,
      tag: 'rose' as const,
    };
  }

  if (isProgramAdmin) {
    return {
      primary: colors.accent.sky[500],
      primaryLight: colors.accent.sky[50],
      primaryDark: colors.accent.sky[600],
      gradient: colors.gradients.sky,
      tag: 'sky' as const,
    };
  }

  if (isMasterAdmin) {
    return {
      primary: colors.primary[500],
      primaryLight: colors.primary[50],
      primaryDark: colors.primary[600],
      gradient: colors.gradients.primary,
      tag: 'emerald' as const,
    };
  }

  // Default fallback
  return {
    primary: colors.primary[500],
    primaryLight: colors.primary[50],
    primaryDark: colors.primary[600],
    gradient: colors.gradients.primary,
    tag: 'default' as const,
  };
};
