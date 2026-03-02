import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';

/**
 * Hook for fetching a student's issued/revoked certificates.
 */
export function useCertifications(studentId: string | undefined) {
  return useQuery({
    queryKey: ['certifications', studentId],
    queryFn: async () => {
      const { data, error } = await certificationsService.getCertificationsForStudent(
        studentId!,
      );
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

/**
 * Hook for fetching a single certification with full details.
 */
export function useCertificationDetail(certificationId: string | undefined) {
  return useQuery({
    queryKey: ['certification', certificationId],
    queryFn: async () => {
      const { data, error } = await certificationsService.getCertificationById(
        certificationId!,
      );
      if (error) throw error;
      return data;
    },
    enabled: !!certificationId,
  });
}

/**
 * Hook for checking certification eligibility for an enrollment.
 */
export function useCertificationEligibility(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['certification-eligibility', enrollmentId],
    queryFn: async () => {
      const { data, error } = await certificationsService.checkCertificationEligibility(
        enrollmentId!,
      );
      if (error) throw error;
      return data;
    },
    enabled: !!enrollmentId,
  });
}
