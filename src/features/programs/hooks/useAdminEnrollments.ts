import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';

export function useClassEnrollments(classId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'class', classId],
    queryFn: async () => {
      if (!classId) throw new Error('Class ID required');
      const { data, error } = await programsService.getClassEnrollments(classId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!classId,
  });
}

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateEnrollmentStatus'],
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: 'active' | 'dropped' }) =>
      programsService.updateEnrollmentStatus(enrollmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
