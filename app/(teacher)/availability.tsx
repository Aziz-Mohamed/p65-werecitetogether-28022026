import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState } from '@/components/feedback';
import { AvailabilityToggle } from '@/features/teacher-availability/components/AvailabilityToggle';
import { availabilityService } from '@/features/teacher-availability/services/availability.service';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

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

  // Filter to free/mixed programs only
  const eligiblePrograms = useMemo(() => {
    if (!programRoles) return [];
    return programRoles
      .filter((pr) => {
        const cat = pr.programs?.category;
        return cat === 'free' || cat === 'mixed';
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
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('availability.title')}</Text>
        <AvailabilityToggle eligiblePrograms={eligiblePrograms} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
    marginBottom: spacing.sm,
  },
});
