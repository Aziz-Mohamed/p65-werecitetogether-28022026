import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsService } from '../services/sessions.service';
import type { CompleteSessionInput } from '../types';

export const useSessionsByStudent = (studentId: string | undefined, status?: string) =>
  useQuery({
    queryKey: ['sessions', 'student', studentId, status],
    queryFn: async () => {
      const result = await sessionsService.getStudentSessions(studentId!, status);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!studentId,
    staleTime: 60_000,
  });

export const useSessionsByTeacher = (teacherId: string | undefined, status?: string) =>
  useQuery({
    queryKey: ['sessions', 'teacher', teacherId, status],
    queryFn: async () => {
      const result = await sessionsService.getSessionsByTeacher(teacherId!, status);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!teacherId,
    staleTime: 60_000,
  });

export const useSessionById = (sessionId: string | undefined) =>
  useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const result = await sessionsService.getSessionById(sessionId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!sessionId,
    staleTime: 30_000,
  });

export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteSessionInput) => {
      const result = await sessionsService.completeSession(input);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await sessionsService.cancelSession(sessionId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
    },
  });
};

export const useLogAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      entries,
    }: {
      sessionId: string;
      entries: { studentId: string; score?: number; notes?: string }[];
    }) => {
      const result = await sessionsService.logAttendance(sessionId, entries);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
