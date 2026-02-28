import { useMemo } from 'react';
import { buildEnrollmentsProfile } from '../config/subscription-profiles';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { RealtimeStatus } from '../types/realtime.types';

/**
 * Subscribes to realtime enrollment changes for a student.
 * Automatically invalidates enrollment queries on status changes.
 */
export function useEnrollmentsRealtime(
  studentId: string | undefined,
): RealtimeStatus {
  const profile = useMemo(
    () => (studentId ? buildEnrollmentsProfile(studentId) : null),
    [studentId],
  );

  return useRealtimeSubscription(profile);
}
