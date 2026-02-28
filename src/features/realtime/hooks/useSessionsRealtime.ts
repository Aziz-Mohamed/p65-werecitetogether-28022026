import { useMemo } from 'react';
import { buildSessionsProfile } from '../config/subscription-profiles';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { RealtimeStatus } from '../types/realtime.types';

/**
 * Subscribes to realtime sessions changes for a user.
 * Automatically invalidates ['sessions'] and dashboard queries.
 */
export function useSessionsRealtime(
  userId: string | undefined,
  filterColumn: 'teacher_id' | 'student_id',
): RealtimeStatus {
  const profile = useMemo(
    () => (userId ? buildSessionsProfile(userId, filterColumn) : null),
    [userId, filterColumn],
  );

  return useRealtimeSubscription(profile);
}
