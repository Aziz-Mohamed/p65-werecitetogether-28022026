import React from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { ProgramSelector } from '@/features/admin/components/ProgramSelector';
import { useProgramAdminPrograms } from '@/features/admin/hooks/useProgramAdminPrograms';

export default function ProgramAdminSelect() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const { data: programs, isLoading } = useProgramAdminPrograms(userId);

  return (
    <Screen>
      <ProgramSelector
        programs={programs ?? []}
        isLoading={isLoading}
        onSelect={(programId) => {
          router.replace({
            pathname: '/(program-admin)/(tabs)',
            params: { programId },
          });
        }}
      />
    </Screen>
  );
}
