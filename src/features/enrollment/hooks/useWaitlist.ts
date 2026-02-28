import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waitlistService } from '../services/waitlist.service';

export const useWaitlistPosition = (
  studentId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['waitlist-position', studentId, programId],
    queryFn: async () => {
      const result = await waitlistService.getWaitlistPosition(studentId!, programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!studentId && !!programId,
    staleTime: 30_000,
  });

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      studentId: string;
      programId: string;
      trackId?: string;
      cohortId?: string;
      teacherId?: string;
    }) => {
      const result = await waitlistService.joinWaitlist(data);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-position', variables.studentId, variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['waitlist', variables.programId] });
    },
  });
};

export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const result = await waitlistService.leaveWaitlist(entryId);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-position'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
};

export const useConfirmWaitlistOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const result = await waitlistService.confirmWaitlistOffer(entryId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-position'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};
