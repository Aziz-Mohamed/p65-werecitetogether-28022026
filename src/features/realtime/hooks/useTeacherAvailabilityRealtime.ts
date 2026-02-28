import { useMemo } from 'react';
import { buildTeacherAvailabilityProfile } from '../config/subscription-profiles';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { RealtimeStatus } from '../types/realtime.types';

/**
 * Subscribes to realtime teacher_availability changes for a program.
 * Automatically invalidates ['teacher-availability', programId] queries.
 */
export function useTeacherAvailabilityRealtime(
  programId: string | undefined,
): RealtimeStatus {
  const profile = useMemo(
    () => (programId ? buildTeacherAvailabilityProfile(programId) : null),
    [programId],
  );

  return useRealtimeSubscription(profile);
}
