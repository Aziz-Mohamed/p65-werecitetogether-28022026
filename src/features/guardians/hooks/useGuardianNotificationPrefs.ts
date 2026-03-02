import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardiansService } from '../services/guardians.service';

export function useGuardianNotificationPrefs(guardianId?: string) {
  return useQuery({
    queryKey: ['guardian-notification-prefs', guardianId],
    queryFn: async () => {
      const { data, error } = await guardiansService.getGuardianNotificationPreferences(guardianId!);
      if (error) throw error;
      return data;
    },
    enabled: !!guardianId,
  });
}

export function useUpdateGuardianNotificationPref(guardianId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, enabled }: { category: string; enabled: boolean }) => {
      const { data, error } = await guardiansService.updateGuardianNotificationPreference(
        guardianId!,
        category,
        enabled,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-notification-prefs', guardianId] });
    },
  });
}
