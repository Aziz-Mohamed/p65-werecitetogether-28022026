import { useMemo } from 'react';
import { useRubReference } from '@/features/gamification/hooks/useRubReference';
import { useRubCertifications } from '@/features/gamification/hooks/useRubCertifications';
import { useMemorizationProgress } from './useMemorizationProgress';
import { useAssignments } from './useAssignments';
import { computeRubCoverage, type RubCoverage, type AyahRange } from '../utils/rub-coverage';

/**
 * Combines rub' reference data with memorization progress and pending
 * self-assigned new_hifz to compute per-rub' coverage.
 *
 * Returns:
 * - `inProgress`: rub' with 0 < totalPercentage < 100% (actively being built)
 * - `completed`: rub' with 100% totalPercentage but NOT yet certified
 * - `allCoverage`: full sparse coverage map
 */
export function useRubCoverage(studentId: string | undefined) {
  const {
    data: rubReference = [],
    isLoading: refLoading,
  } = useRubReference();

  const {
    data: progress = [],
    isLoading: progressLoading,
  } = useMemorizationProgress({ studentId: studentId ?? '' });

  const {
    certMap,
    isLoading: certLoading,
  } = useRubCertifications(studentId);

  // Fetch pending self-assigned new_hifz assignments
  const {
    data: pendingNewHifz = [],
    isLoading: assignmentsLoading,
  } = useAssignments({
    studentId: studentId ?? '',
    assignmentType: 'new_hifz',
    status: 'pending',
  });

  // Transform assignments to ayah ranges for coverage computation
  const assignmentRanges: AyahRange[] = useMemo(
    () =>
      pendingNewHifz.map((a) => ({
        id: a.id,
        surah_number: a.surah_number,
        from_ayah: a.from_ayah,
        to_ayah: a.to_ayah,
      })),
    [pendingNewHifz],
  );

  const allCoverage = useMemo(
    () => computeRubCoverage(rubReference, progress, assignmentRanges),
    [rubReference, progress, assignmentRanges],
  );

  // In progress: has some coverage, not 100%, and not yet certified
  const inProgress = useMemo(
    () =>
      allCoverage.filter(
        (c) => c.totalPercentage > 0 && c.totalPercentage < 100 && !certMap.has(c.rubNumber),
      ),
    [allCoverage, certMap],
  );

  // Completed: 100% total coverage but not yet certified by teacher
  const completed = useMemo(
    () =>
      allCoverage.filter(
        (c) => c.totalPercentage === 100 && !certMap.has(c.rubNumber),
      ),
    [allCoverage, certMap],
  );

  // Combined: all uncertified rub' with any coverage, sorted by rubNumber.
  // Certified rub' are excluded — they belong on the Journey map.
  const uncertified = useMemo(
    () =>
      allCoverage
        .filter((c) => c.totalPercentage > 0 && !certMap.has(c.rubNumber))
        .sort((a, b) => a.rubNumber - b.rubNumber),
    [allCoverage, certMap],
  );

  // Stats
  const totalRubInProgress = inProgress.length;
  const totalRubCompleted = completed.length;

  return {
    allCoverage,
    inProgress,
    completed,
    uncertified,
    totalRubInProgress,
    totalRubCompleted,
    isLoading: refLoading || progressLoading || certLoading || assignmentsLoading,
  };
}
