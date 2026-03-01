import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { himamService } from '../services/himam.service';
import type { TimeSlot } from '../types/himam.types';

/**
 * Hook for fetching a student's registration for a specific event.
 */
export function useHimamRegistration(
  eventId: string | undefined,
  studentId: string | undefined,
) {
  return useQuery({
    queryKey: ['himam-registration', eventId, studentId],
    queryFn: async () => {
      const { data, error } = await himamService.getRegistration(eventId!, studentId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!studentId,
  });
}

/**
 * Hook for fetching all registrations for an event.
 */
export function useHimamRegistrations(eventId: string | undefined, track?: string) {
  return useQuery({
    queryKey: ['himam-registrations', eventId, track],
    queryFn: async () => {
      const { data, error } = await himamService.getEventRegistrations(eventId!, track);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

/**
 * Mutation hook for registering for an event.
 */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      studentId,
      track,
    }: {
      eventId: string;
      studentId: string;
      track: string;
    }) => himamService.registerForEvent(eventId, studentId, track),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['himam-registration', variables.eventId, variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['himam-registrations', variables.eventId],
      });
    },
  });
}

/**
 * Mutation hook for updating time slots.
 */
export function useUpdateTimeSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      registrationId,
      timeSlots,
    }: {
      registrationId: string;
      timeSlots: TimeSlot[];
    }) => himamService.updateTimeSlots(registrationId, timeSlots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam-registration'] });
    },
  });
}

/**
 * Mutation hook for cancelling a registration.
 */
export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      himamService.cancelRegistration(registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['himam-registration'] });
      queryClient.invalidateQueries({ queryKey: ['himam-registrations'] });
    },
  });
}
