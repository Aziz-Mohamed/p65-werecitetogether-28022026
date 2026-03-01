import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { CreateEventInput } from '../types/himam.types';

/**
 * Hook for fetching upcoming/active Himam events for a program.
 */
export function useHimamEvents(programId: string | undefined) {
  return useQuery({
    queryKey: ['himam-events', programId],
    queryFn: async () => {
      const { data, error } = await himamService.getUpcomingEvents(programId!);
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

/**
 * Hook for fetching a single Himam event.
 */
export function useHimamEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['himam-event', eventId],
    queryFn: async () => {
      const { data, error } = await himamService.getEventById(eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

/**
 * Mutation hook for creating a new Himam event.
 */
export function useCreateHimamEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, createdBy }: { input: CreateEventInput; createdBy: string }) =>
      himamService.createEvent(input, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam-events'] });
    },
  });
}

/**
 * Mutation hook for cancelling a Himam event.
 */
export function useCancelHimamEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => himamService.cancelEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam-events'] });
      queryClient.invalidateQueries({ queryKey: ['himam-event'] });
      queryClient.invalidateQueries({ queryKey: ['himam-registrations'] });
    },
  });
}
