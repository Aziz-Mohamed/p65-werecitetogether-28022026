import { useQuery } from '@tanstack/react-query';
import { voiceMemoService } from '../services/voice-memo.service';

export const useVoiceMemo = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['voice-memo', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await voiceMemoService.getMemoMetadata(sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};

export const useVoiceMemoUrl = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['voice-memo-url', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await voiceMemoService.getMemoUrl(sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};
