import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

// ─── Entry Point ──────────────────────────────────────────────────────────────

export default function Index() {
  const { isAuthenticated, isLoading, role } = useAuth();

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
}
