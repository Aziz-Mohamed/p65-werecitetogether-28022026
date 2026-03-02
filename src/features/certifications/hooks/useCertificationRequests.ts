import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';
import type { RecommendInput } from '../types/certifications.types';

/**
 * Hook for fetching certification requests for a program.
 */
export function useCertificationRequests(
  programId: string | undefined,
  status?: string,
) {
  return useQuery({
    queryKey: ['certification-requests', programId, status],
    queryFn: async () => {
      const { data, error } = await certificationsService.getCertificationRequests(
        programId!,
        status,
      );
      if (error) throw error;
      return data;
    },
    enabled: !!programId,
  });
}

/**
 * Mutation hook for recommending a student for certification.
 */
export function useRecommendForCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecommendInput) =>
      certificationsService.recommendForCertification(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['certification-eligibility'] });
    },
  });
}

/**
 * Mutation hook for supervisor review (approve/reject).
 */
export function useReviewCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      action,
      supervisorId,
      note,
    }: {
      certificationId: string;
      action: 'approve' | 'reject';
      supervisorId: string;
      note?: string;
    }) =>
      certificationsService.reviewCertification(certificationId, action, supervisorId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['certification'] });
    },
  });
}

/**
 * Mutation hook for program admin issuing a certification.
 */
export function useIssueCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      issuedBy,
      chainOfNarration,
    }: {
      certificationId: string;
      issuedBy: string;
      chainOfNarration?: string;
    }) =>
      certificationsService.issueCertification(certificationId, issuedBy, chainOfNarration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['certification'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}

/**
 * Mutation hook for revoking a certification.
 */
export function useRevokeCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificationId,
      revokedBy,
      reason,
    }: {
      certificationId: string;
      revokedBy: string;
      reason: string;
    }) => certificationsService.revokeCertification(certificationId, revokedBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certification'] });
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
    },
  });
}
