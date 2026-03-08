import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolSettingsService } from '../services/school-settings.service';
import type { SchoolSettings } from '../types/school-settings.types';

/**
 * Read school settings.
 */
export function useSchoolSettings(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['school-settings', schoolId],
    queryFn: async () => {
      const { data, error } = await schoolSettingsService.getSettings(schoolId!);
      if (error) throw error;
      return (data?.settings ?? {}) as SchoolSettings;
    },
    enabled: !!schoolId,
  });
}

/**
 * Derived: can teacher create sessions? Default is true when not explicitly set.
 */
export function useCanTeacherCreateSessions(schoolId: string | undefined) {
  const { data: settings, isLoading } = useSchoolSettings(schoolId);
  return {
    canCreate: settings?.teacher_can_create_sessions !== false,
    isLoading,
  };
}

/**
 * Mutation to update school settings.
 */
export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, settings }: { schoolId: string; settings: Partial<SchoolSettings> }) => {
      const { data, error } = await schoolSettingsService.updateSettings(schoolId, settings);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
    },
  });
}
