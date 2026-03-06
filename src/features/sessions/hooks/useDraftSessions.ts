import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';
import type { UpdateDraftInput } from '../types/sessions.types';
import { useAuth } from '@/hooks/useAuth';

export const useDraftSessions = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['sessions', 'drafts'],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await sessionsService.getSessions({
        teacherId: profile.id,
        status: 'draft',
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });
};

export const useUpdateDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: UpdateDraftInput }) =>
      sessionsService.updateDraft(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
};

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionsService.deleteDraft(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
