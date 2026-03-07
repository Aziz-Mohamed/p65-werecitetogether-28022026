import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { WaitlistEntry, WaitlistEntryWithStudent } from '../types/programs.types';

/** Fetch waitlist entries for a cohort (admin view) */
export function useCohortWaitlist(cohortId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'cohort', cohortId],
    queryFn: async () => {
      if (!cohortId) throw new Error('Cohort ID required');
      const { data, error } = await programsService.getCohortWaitlist(cohortId);
      if (error) throw error;
      return (data ?? []) as unknown as WaitlistEntryWithStudent[];
    },
    enabled: !!cohortId,
  });
}

/** Fetch student's own waitlist entry for a cohort */
export function useMyWaitlistEntry(cohortId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'my', cohortId, userId],
    queryFn: async () => {
      if (!cohortId || !userId) throw new Error('Cohort ID and User ID required');
      const { data, error } = await programsService.getMyWaitlistEntry(cohortId, userId);
      if (error) throw error;
      return data as WaitlistEntry | null;
    },
    enabled: !!cohortId && !!userId,
  });
}

/** Cancel own waitlist entry */
export function useCancelWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (waitlistId: string) => programsService.cancelWaitlistEntry(waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

/** Promote next student(s) from waitlist (admin) */
export function usePromoteFromWaitlist(cohortId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => programsService.promoteFromWaitlist(cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
