import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceMemosService } from '../services/voice-memos.service';
import type { UploadVoiceMemoInput } from '../types';

export const useUploadVoiceMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadVoiceMemoInput) => {
      const result = await voiceMemosService.uploadVoiceMemo(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['voice-memo', variables.sessionId, variables.studentId],
      });
    },
  });
};

export const useVoiceMemoForSession = (
  sessionId: string | undefined,
  studentId: string | undefined,
) =>
  useQuery({
    queryKey: ['voice-memo', sessionId, studentId],
    queryFn: async () => {
      const result = await voiceMemosService.getVoiceMemoForSession(sessionId!, studentId!);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!sessionId && !!studentId,
    staleTime: 60_000,
  });

export const useVoiceMemoUrl = (storagePath: string | undefined) =>
  useQuery({
    queryKey: ['voice-memo-url', storagePath],
    queryFn: async () => {
      const result = await voiceMemosService.getVoiceMemoUrl(storagePath!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!storagePath,
    staleTime: 3_000_000, // 50 minutes (URL expires in 1 hour)
  });
