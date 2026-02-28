import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';

export const useQueuePosition = (
  studentId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['queue-position', studentId, programId],
    queryFn: async () => {
      const result = await queueService.getQueuePosition(studentId!, programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!studentId && !!programId,
    staleTime: 10_000,
  });

export const useQueueSize = (programId: string | undefined) =>
  useQuery({
    queryKey: ['queue-size', programId],
    queryFn: async () => {
      const result = await queueService.getQueueSize(programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!programId,
    staleTime: 10_000,
  });

export const useDailySessionCount = (
  studentId: string | undefined,
  programId: string | undefined,
) =>
  useQuery({
    queryKey: ['daily-session-count', studentId, programId],
    queryFn: async () => {
      const result = await queueService.getDailySessionCount(studentId!, programId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!studentId && !!programId,
    staleTime: 30_000,
  });

export const useJoinQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, programId }: { studentId: string; programId: string }) => {
      const result = await queueService.joinQueue(studentId, programId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['queue-position', variables.studentId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['queue-size', variables.programId],
      });
    },
  });
};

export const useLeaveQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      queueEntryId,
      studentId,
      programId,
    }: {
      queueEntryId: string;
      studentId: string;
      programId: string;
    }) => {
      const result = await queueService.leaveQueue(queueEntryId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['queue-position', variables.studentId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['queue-size', variables.programId],
      });
    },
  });
};

export const useClaimQueueSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      queueEntryId,
      studentId,
      programId,
    }: {
      queueEntryId: string;
      studentId: string;
      programId: string;
    }) => {
      const result = await queueService.claimQueueSlot(queueEntryId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['queue-position', variables.studentId, variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['queue-size', variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['daily-session-count', variables.studentId, variables.programId],
      });
    },
  });
};
