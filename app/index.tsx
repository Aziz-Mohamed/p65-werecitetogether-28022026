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

  if (!onboardingCompleted) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  const route = role ? ROLE_ROUTES[role] : null;
  if (route) {
    return <Redirect href={route as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}
