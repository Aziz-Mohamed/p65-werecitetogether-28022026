import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import { getDecayInterval } from '../utils/freshness';

export interface RevisionInput {
  certificationId: string;
  studentId: string;
  reviewCount: number;
  dormantSince: string | null;
}

/**
 * Mutation hook for recording rubʿ revisions.
 *
 * Modes:
 * - good: Increments review_count atomically via RPC, clears dormant_since
 * - poor: Sets last_reviewed_at to yield 50% freshness, does NOT clear dormancy
 * - recertify: Full reset for 90+ day dormancy (requires certifiedBy)
 *
 * Dormant recovery logic:
 * - 0-30 days dormant: Normal good revision (increment count)
 * - 30-90 days dormant: Good revision + reset review count
 * - 90+ days dormant: Requires re-certification
 */
export const useRecordRevision = () => {
  const queryClient = useQueryClient();

  const goodRevision = useMutation({
    mutationKey: ['record-good-revision'],
    mutationFn: (input: RevisionInput) => {
      const dormantDays = input.dormantSince
        ? (Date.now() - Date.parse(input.dormantSince)) / (24 * 60 * 60 * 1000)
        : 0;

      // 30-90 day dormancy: reset review count
      const resetReviewCount = dormantDays >= 30 && dormantDays < 90;

      return gamificationService.recordGoodRevision(
        input.certificationId,
        resetReviewCount,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rub-certifications', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });

  const poorRevision = useMutation({
    mutationKey: ['record-poor-revision'],
    mutationFn: (input: RevisionInput) => {
      const intervalDays = getDecayInterval(input.reviewCount);
      return gamificationService.recordPoorRevision(
        input.certificationId,
        intervalDays,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rub-certifications', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });

  const recertify = useMutation({
    mutationKey: ['recertify-rub'],
    mutationFn: (input: { certificationId: string; studentId: string; certifiedBy: string }) =>
      gamificationService.recertifyRub(input.certificationId, input.certifiedBy),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rub-certifications', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });

  const batchGoodRevision = useMutation({
    mutationKey: ['batch-good-revision'],
    mutationFn: async (inputs: RevisionInput[]) => {
      const results = await Promise.all(
        inputs.map((input) => {
          const dormantDays = input.dormantSince
            ? (Date.now() - Date.parse(input.dormantSince)) / (24 * 60 * 60 * 1000)
            : 0;
          const resetReviewCount = dormantDays >= 30 && dormantDays < 90;
          return gamificationService.recordGoodRevision(
            input.certificationId,
            resetReviewCount,
          );
        }),
      );
      return results;
    },
    onSuccess: (_data, variables) => {
      // Invalidate once for the batch
      const studentId = variables[0]?.studentId;
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ['rub-certifications', studentId] });
        queryClient.invalidateQueries({ queryKey: ['student-dashboard', studentId] });
      }
    },
  });

  const batchPoorRevision = useMutation({
    mutationKey: ['batch-poor-revision'],
    mutationFn: async (inputs: RevisionInput[]) => {
      const results = await Promise.all(
        inputs.map((input) => {
          const intervalDays = getDecayInterval(input.reviewCount);
          return gamificationService.recordPoorRevision(
            input.certificationId,
            intervalDays,
          );
        }),
      );
      return results;
    },
    onSuccess: (_data, variables) => {
      const studentId = variables[0]?.studentId;
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: ['rub-certifications', studentId] });
        queryClient.invalidateQueries({ queryKey: ['student-dashboard', studentId] });
      }
    },
  });

  return { goodRevision, poorRevision, recertify, batchGoodRevision, batchPoorRevision };
};
