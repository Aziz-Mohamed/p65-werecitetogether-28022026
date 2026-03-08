import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Screen, PageHeader } from '@/components/layout';
import { LoadingState, ErrorState } from '@/components/feedback';
import { AvailabilityToggle } from '@/features/teacher-availability/components/AvailabilityToggle';
import { availabilityService } from '@/features/teacher-availability/services/availability.service';
import { spacing } from '@/theme/spacing';

export default function AvailabilityScreen() {
  const { t } = useTranslation();

  interface ProgramRole {
    program_id: string;
    programs: { id: string; name: string; name_ar: string; category: string } | null;
  }

  const { data: programRoles, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-eligible-programs'],
    queryFn: async () => {
      const { data, error } = await availabilityService.getEligiblePrograms();
      if (error) throw error;
      return (data ?? []) as ProgramRole[];
    },
  });

  // Filter to free (open) programs only
  const eligiblePrograms = useMemo(() => {
    if (!programRoles) return [];
    return programRoles
      .filter((pr) => {
        const cat = pr.programs?.category;
        return cat === 'free';
      })
      .map((pr) => ({
        program_id: pr.program_id,
        name: pr.programs?.name ?? '',
        name_ar: pr.programs?.name_ar ?? '',
      }));
  }, [programRoles]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <BottomSheetModalProvider>
      <Screen scroll>
        <View style={styles.container}>
          <PageHeader title={t('availability.title')} />
          <AvailabilityToggle eligiblePrograms={eligiblePrograms} />
        </View>
      </Screen>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
