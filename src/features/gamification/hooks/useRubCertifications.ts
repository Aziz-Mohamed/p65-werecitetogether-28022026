import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import { computeFreshness } from '../utils/freshness';
import { useDormancySync } from './useDormancySync';
import type { RubCertification, EnrichedCertification } from '../types/gamification.types';

/**
 * Fetches all rubʿ certifications for a student and enriches each
 * with client-side computed freshness data.
 *
 * Returns enriched list + derived aggregates (activeCount, criticalCount, dormantCount)
 * and a Map<rubNumber, EnrichedCertification> for O(1) lookup.
 */
export const useRubCertifications = (studentId: string | undefined) => {
  const query = useQuery({
    queryKey: ['rub-certifications', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data, error } = await gamificationService.getRubCertifications(studentId);
      if (error) throw error;
      return (data ?? []) as RubCertification[];
    },
    enabled: !!studentId,
  });

  const enriched = useMemo(() => {
    if (!query.data) return [];
    return query.data.map((cert): EnrichedCertification => ({
      ...cert,
      freshness: computeFreshness(
        cert.last_reviewed_at,
        cert.review_count,
        cert.dormant_since,
      ),
    }));
  }, [query.data]);

  const certMap = useMemo(() => {
    const map = new Map<number, EnrichedCertification>();
    for (const cert of enriched) {
      map.set(cert.rub_number, cert);
    }
    return map;
  }, [enriched]);

  const activeCount = useMemo(
    () => enriched.filter((c) => c.freshness.state !== 'dormant').length,
    [enriched],
  );

  const criticalCount = useMemo(
    () => enriched.filter((c) => c.freshness.state === 'critical' || c.freshness.state === 'warning').length,
    [enriched],
  );

  const dormantCount = useMemo(
    () => enriched.filter((c) => c.freshness.state === 'dormant').length,
    [enriched],
  );

  // Detect newly dormant certs and write back to DB
  useDormancySync(studentId, enriched);

  return {
    ...query,
    enriched,
    certMap,
    activeCount,
    criticalCount,
    dormantCount,
  };
};
