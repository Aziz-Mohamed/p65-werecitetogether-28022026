import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { gamificationService } from '../services/gamification.service';
import type { EnrichedCertification } from '../types/gamification.types';

const MIN_SYNC_INTERVAL_MS = 60_000; // Prevent re-syncing more than once per minute

/**
 * Detects dormant certifications (freshness 0% but dormant_since IS NULL)
 * and writes back dormancy status to the server. Then updates the student's
 * cached level.
 *
 * Runs on mount and on screen focus to catch rubʿ that have decayed
 * since the user last opened the app.
 */
export const useDormancySync = (
  studentId: string | undefined,
  enrichedCertifications: EnrichedCertification[],
) => {
  const queryClient = useQueryClient();
  const lastSyncRef = useRef(0);

  const sync = useCallback(async () => {
    if (!studentId || enrichedCertifications.length === 0) return;

    // Throttle: skip if synced recently
    const now = Date.now();
    if (now - lastSyncRef.current < MIN_SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;

    // Find certs with 0% freshness but not yet marked dormant in DB
    const newlyDormant = enrichedCertifications.filter(
      (c) => c.freshness.percentage <= 0 && c.dormant_since === null,
    );

    if (newlyDormant.length === 0) return;

    const ids = newlyDormant.map((c) => c.id);

    try {
      await gamificationService.markDormant(ids);

      // Recompute level = active (non-dormant) certs
      const activeCount = enrichedCertifications.filter(
        (c) => c.freshness.state !== 'dormant' && !ids.includes(c.id),
      ).length;

      await gamificationService.updateStudentLevel(studentId, activeCount);

      // Invalidate queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['rub-certifications', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard', studentId] });
    } catch {
      // Silently fail — will retry on next focus
    }
  }, [studentId, enrichedCertifications, queryClient]);

  // Run on screen focus (skip first mount to avoid double-sync with initial load)
  const firstMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstMount.current) {
        firstMount.current = false;
        // Still run sync on first mount to catch decay
        sync();
        return;
      }
      sync();
    }, [sync]),
  );
};
