import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';
import { mutationTracker } from '@/features/realtime';
import { gamificationService } from '@/features/gamification/services/gamification.service';
import type { CreateSessionInput, SessionFilters } from '../types/sessions.types';

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['create-session'],
    mutationFn: (input: CreateSessionInput) => sessionsService.createSession(input),
    onSuccess: (data, variables) => {
      if (data?.data?.id) {
        mutationTracker.record('sessions', data.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.student_id],
      });

      // Check session milestones for badge awarding (fire-and-forget)
      if (variables.program_id) {
        gamificationService
          .checkSessionMilestones(variables.student_id, variables.program_id)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ['gamification', 'badges', 'earned', variables.student_id],
            });
          })
          .catch(() => {
            // Non-critical: milestone check failure should not block session save
          });
      }
    },
  });
};

export const useSessions = (filters: SessionFilters) => {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const { data, error } = await sessionsService.getSessions(filters);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useSessionById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => {
      if (!id) throw new Error('Session ID is required');
      const { data, error } = await sessionsService.getSessionById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};
