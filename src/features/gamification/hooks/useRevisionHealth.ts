import { useCallback, useMemo } from 'react';

import { useRubCertifications } from './useRubCertifications';
import { useRubReference } from './useRubReference';
import { useRequestRevision } from './useRequestRevision';
import { useRevisionHomework } from './useRevisionHomework';
import { useCancelAssignment } from '@/features/memorization';
import { useStudentDashboard } from '@/features/dashboard/hooks/useStudentDashboard';
import type { EnrichedCertification, RubReference } from '../types/gamification.types';
import type { CertGroup } from '../components/GroupRevisionSheet';

export function useRevisionHealth(studentId: string | undefined) {
  const {
    enriched,
    activeCount,
    dormantCount,
    isLoading,
    error,
    refetch,
  } = useRubCertifications(studentId);

  const { data: rubReferenceList } = useRubReference();
  const rubReferenceMap = useMemo(() => {
    const map = new Map<number, RubReference>();
    if (rubReferenceList) {
      for (const ref of rubReferenceList) {
        map.set(ref.rub_number, ref);
      }
    }
    return map;
  }, [rubReferenceList]);

  const { data: dashboardData } = useStudentDashboard(studentId);
  const canSelfAssign = dashboardData?.student?.can_self_assign ?? false;
  const schoolId = dashboardData?.student?.school_id ?? '';

  const requestRevision = useRequestRevision();
  const cancelAssignment = useCancelAssignment();

  const { homeworkItems, pendingKeys } = useRevisionHomework(studentId);

  const homeworkRubSet = useMemo(
    () => new Set(homeworkItems.map((h) => h.rubNumber)),
    [homeworkItems],
  );

  const effectiveCriticalCount = useMemo(
    () => enriched.filter(
      (c) => (c.freshness.state === 'critical' || c.freshness.state === 'warning')
        && !homeworkRubSet.has(c.rub_number),
    ).length,
    [enriched, homeworkRubSet],
  );

  const healthCounts = useMemo(() => {
    const counts: Record<string, number> = {
      fresh: 0, fading: 0, warning: 0, critical: 0, dormant: 0,
    };
    for (const cert of enriched) {
      counts[cert.freshness.state] = (counts[cert.freshness.state] ?? 0) + 1;
    }
    return counts;
  }, [enriched]);

  const isAlreadyInPlan = useCallback((cert: EnrichedCertification): boolean => {
    const ref = rubReferenceMap.get(cert.rub_number);
    if (!ref) return false;
    return pendingKeys.has(`${ref.start_surah}:${ref.start_ayah}`);
  }, [rubReferenceMap, pendingKeys]);

  const addToPlan = useCallback(
    (cert: EnrichedCertification, callbacks?: { onSuccess?: () => void }) => {
      if (!studentId || !schoolId) return;
      const ref = rubReferenceMap.get(cert.rub_number);
      if (!ref) return;

      requestRevision.mutate(
        { studentId, schoolId, reference: ref },
        { onSuccess: callbacks?.onSuccess },
      );
    },
    [studentId, schoolId, rubReferenceMap, requestRevision],
  );

  const addGroupToPlan = useCallback(
    async (group: CertGroup): Promise<number> => {
      if (!studentId || !schoolId || !canSelfAssign) return 0;

      const eligible = group.children.filter((c) => {
        if (c.freshness.state === 'dormant') return false;
        return !isAlreadyInPlan(c);
      });

      if (eligible.length === 0) return 0;

      const promises = eligible.map((cert) => {
        const ref = rubReferenceMap.get(cert.rub_number);
        if (!ref) return Promise.resolve();
        return requestRevision.mutateAsync({ studentId, schoolId, reference: ref });
      });
      await Promise.all(promises);
      return eligible.length;
    },
    [studentId, schoolId, canSelfAssign, isAlreadyInPlan, rubReferenceMap, requestRevision],
  );

  const removeHomework = useCallback(
    (assignmentId: string, callbacks?: { onSuccess?: () => void }) => {
      cancelAssignment.mutate(assignmentId, { onSuccess: callbacks?.onSuccess });
    },
    [cancelAssignment],
  );

  return {
    // Query state
    enriched,
    activeCount,
    dormantCount,
    isLoading,
    error,
    refetch,

    // Derived data
    rubReferenceMap,
    canSelfAssign,
    schoolId,
    homeworkItems,
    homeworkRubSet,
    effectiveCriticalCount,
    healthCounts,

    // Mutations
    isAddingToPlan: requestRevision.isPending,
    isAlreadyInPlan,
    addToPlan,
    addGroupToPlan,
    removeHomework,
  };
}
