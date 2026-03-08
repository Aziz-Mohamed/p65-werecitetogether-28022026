import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/common.types';

const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/(student)/',
  teacher: '/(teacher)/',
  supervisor: '/(supervisor)/',
  program_admin: '/(program-admin)/',
  master_admin: '/(master-admin)/',
};

export default function Index() {
  const { isAuthenticated, isLoading, role, onboardingCompleted } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect to role-based dashboard
  switch (role) {
    case 'student':
      return <Redirect href="/(student)/" />;
    case 'teacher':
      return <Redirect href="/(teacher)/" />;
    case 'parent':
      return <Redirect href="/(parent)/" />;
    case 'supervisor':
      return <Redirect href="/(supervisor)/" />;
    case 'program_admin':
      return <Redirect href="/(program-admin)/" />;
    case 'master_admin':
      return <Redirect href="/(master-admin)/" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }

  const route = role ? ROLE_ROUTES[role] : null;
  if (route) {
    return <Redirect href={route as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}
