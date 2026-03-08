import { useQuery } from '@tanstack/react-query';
import { ratingsService } from '../services/ratings.service';

export function useTeacherReviews(teacherId: string | undefined, programId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['teacher-reviews', teacherId, programId, page],
    queryFn: async () => {
      if (!teacherId || !programId) throw new Error('Teacher ID and Program ID required');
      return ratingsService.getTeacherReviews(teacherId, programId, page);
    },
    enabled: !!teacherId && !!programId,
  });
}
