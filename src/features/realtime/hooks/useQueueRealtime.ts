import { useRealtimeSubscription } from './useRealtimeSubscription';
import { buildQueueProfile } from '../config/subscription-profiles';

/**
 * Subscribes to realtime queue updates for a specific program.
 * Invalidates queue position and queue size queries on changes.
 */
export function useQueueRealtime(programId: string | undefined) {
  const profile = programId ? buildQueueProfile(programId) : null;
  useRealtimeSubscription(profile);
}
