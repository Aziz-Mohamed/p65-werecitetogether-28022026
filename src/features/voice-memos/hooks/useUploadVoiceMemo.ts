import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceMemoService } from '../services/voice-memo.service';
import { uploadQueue } from '../services/upload-queue';
import type { UploadVoiceMemoInput } from '../types/voice-memo.types';

export const useUploadVoiceMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadVoiceMemoInput) => {
      const { data, error } = await voiceMemoService.uploadMemo(
        input.sessionId,
        input.fileUri,
        input.durationSeconds,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voice-memo', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['voice-memo-url', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: async (_error, variables) => {
      // Queue for retry on failure
      await uploadQueue.add({
        sessionId: variables.sessionId,
        fileUri: variables.fileUri,
        durationSeconds: variables.durationSeconds,
        addedAt: new Date().toISOString(),
      });
    },
  });
};
