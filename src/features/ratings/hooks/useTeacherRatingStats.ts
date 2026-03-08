import { useQuery } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';
import type { RatingStats } from '../types/ratings.types';

export function useTeacherRatingStats(teacherId: string | undefined, programId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-rating-stats', teacherId, programId],
    queryFn: async () => {
      if (!teacherId || !programId) throw new Error('Teacher ID and Program ID required');
      return ratingsService.getTeacherRatingStats(teacherId, programId);
    },
    enabled: !!teacherId && !!programId,
  });
}
