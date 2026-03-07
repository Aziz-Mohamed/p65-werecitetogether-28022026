import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import type { WaitlistEntry, WaitlistEntryWithStudent } from '../types/programs.types';

/** Fetch waitlist entries for a class (admin view) */
export function useClassWaitlist(classId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'class', classId],
    queryFn: async () => {
      if (!classId) throw new Error('Class ID required');
      const { data, error } = await programsService.getClassWaitlist(classId);
      if (error) throw error;
      return (data ?? []) as unknown as WaitlistEntryWithStudent[];
    },
    enabled: !!classId,
  });
}

/** Fetch student's own waitlist entry for a class */
export function useMyWaitlistEntry(classId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'my', classId, userId],
    queryFn: async () => {
      if (!classId || !userId) throw new Error('Class ID and User ID required');
      const { data, error } = await programsService.getMyWaitlistEntry(classId, userId);
      if (error) throw error;
      return data as WaitlistEntry | null;
    },
    enabled: !!classId && !!userId,
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
export function usePromoteFromWaitlist(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => programsService.promoteFromWaitlist(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
