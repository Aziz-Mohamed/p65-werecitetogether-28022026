import { useMemo } from 'react';
import { useMemorizationProgress } from './useMemorizationProgress';
import { useAssignments } from './useAssignments';
import { computeRubCoverage, type AyahRange } from '../utils/rub-coverage';

/**
 * Combines memorization progress and pending new_hifz assignments
 * to compute per-rub' coverage.
 *
 * Note: Rub certification was part of the gamification feature (removed).
 * This hook now shows uncertified coverage only.
 */
export function useRubCoverage(studentId: string | undefined) {
  const {
    data: progress = [],
    isLoading: progressLoading,
  } = useMemorizationProgress({ studentId: studentId ?? '' });

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
    () => computeRubCoverage([], progress, assignmentRanges),
    [progress, assignmentRanges],
  );

  // In progress: has some coverage, not 100%
  const inProgress = useMemo(
    () => allCoverage.filter((c) => c.totalPercentage > 0 && c.totalPercentage < 100),
    [allCoverage],
  );

  // Completed: 100% total coverage
  const completed = useMemo(
    () => allCoverage.filter((c) => c.totalPercentage === 100),
    [allCoverage],
  );

  // Combined: all rub' with any coverage, sorted by rubNumber.
  const uncertified = useMemo(
    () =>
      allCoverage
        .filter((c) => c.totalPercentage > 0)
        .sort((a, b) => a.rubNumber - b.rubNumber),
    [allCoverage],
  );

  return {
    allCoverage,
    inProgress,
    completed,
    uncertified,
    totalRubInProgress: inProgress.length,
    totalRubCompleted: completed.length,
    isLoading: progressLoading || assignmentsLoading,
  };
}
