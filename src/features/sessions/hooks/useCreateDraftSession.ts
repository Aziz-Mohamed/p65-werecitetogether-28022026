import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionsService } from '../services/sessions.service';
import type { CreateDraftSessionInput } from '../types';

export const useCreateDraftSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateDraftSessionInput & { studentId: string },
    ) => {
      const result = await sessionsService.createDraftSession(input);
      if (result.error) throw new Error(result.error.message);

      // Atomically increment daily session count using raw SQL to avoid race conditions
      const today = new Date().toISOString().split('T')[0];
      await supabase.rpc('increment_daily_session_count' as never, {
        p_student_id: input.studentId,
        p_program_id: input.programId,
        p_date: today,
      } as never);

      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', variables.programId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sessions'],
      });
      queryClient.invalidateQueries({
        queryKey: ['active-draft-session'],
      });
      queryClient.invalidateQueries({
        queryKey: ['daily-session-count', variables.studentId, variables.programId],
      });
    },
  });
};
