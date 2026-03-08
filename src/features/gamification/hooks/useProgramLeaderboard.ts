import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProgramLeaderboardEntry } from '../types/gamification.types';

/**
 * Fetch the program-scoped leaderboard via RPC.
 * Returns top N students ranked by rubʿ level, plus the current student's rank.
 */
export const useProgramLeaderboard = (
  programId: string | undefined,
  studentId: string | undefined,
  limit = 20,
) => {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID is required');
      const { data, error } = await supabase.rpc(
        'get_program_leaderboard' as never,
        {
          p_program_id: programId,
          p_limit: limit,
          p_student_id: studentId ?? null,
        } as never,
      );
      if (error) throw error;
      return (data ?? []) as unknown as ProgramLeaderboardEntry[];
    },
    enabled: !!programId,
    staleTime: 1000 * 60 * 5,
  });
};
