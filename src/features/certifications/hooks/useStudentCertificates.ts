import { useQuery } from '@tanstack/react-query';
import { certificationsService } from '../services/certifications.service';

export function useStudentCertificates(studentId: string | undefined) {
  return useQuery({
    queryKey: ['certifications', 'student', studentId],
    queryFn: async () => {
      const { data, error } = await certificationsService.getStudentCertificates(studentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
  });
}
