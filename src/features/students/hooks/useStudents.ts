import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '../services/students.service';
import { mutationTracker } from '@/features/realtime';
import type { StudentFilters } from '../types/students.types';

export const useStudents = (filters?: StudentFilters) => {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const { data, error } = await studentsService.getStudents(filters);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useStudentById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      if (!id) throw new Error('Student ID is required');
      const { data, error } = await studentsService.getStudentById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Mutation hook for updating a student record.
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { classId?: string | null; isActive?: boolean; dateOfBirth?: string } }) =>
      studentsService.updateStudent(id, input),
    onSuccess: (_data, variables) => {
      mutationTracker.record('students', variables.id);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] });
    },
  });
}
