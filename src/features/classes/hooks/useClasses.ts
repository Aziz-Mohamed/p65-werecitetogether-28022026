import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesService } from '../services/classes.service';
import { mutationTracker } from '@/features/realtime';
import type { ClassFilters, CreateClassInput } from '../types/classes.types';

/**
 * Hook for fetching classes with optional filters.
 */
export function useClasses(filters?: ClassFilters) {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: async () => {
      const { data, error } = await classesService.getClasses(filters);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single class by ID.
 */
export function useClassById(id: string | undefined) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const { data, error } = await classesService.getClassById(id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Mutation hook for creating a class.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, schoolId }: { input: CreateClassInput; schoolId: string }) =>
      classesService.createClass(input, schoolId),
    onSuccess: (data) => {
      if (data?.data?.id) {
        mutationTracker.record('classes', data.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

/**
 * Mutation hook for updating a class.
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateClassInput> & { is_active?: boolean } }) =>
      classesService.updateClass(id, input),
    onSuccess: (_data, variables) => {
      mutationTracker.record('classes', variables.id);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes', variables.id] });
    },
  });
}

/**
 * Mutation hook for assigning a student to a class.
 */
export function useAssignStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, classId }: { studentId: string; classId: string }) =>
      classesService.assignStudentToClass(studentId, classId),
    onSuccess: (_data, variables) => {
      mutationTracker.record('students', variables.studentId);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

/**
 * Mutation hook for removing a student from a class.
 */
export function useRemoveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      classesService.removeStudentFromClass(studentId),
    onSuccess: (_data, studentId) => {
      mutationTracker.record('students', studentId);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}
