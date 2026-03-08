import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { TeacherStudentRow } from '../types/admin.types';

export function useTeacherStudents(teacherId: string | undefined, programId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-students', teacherId, programId],
    queryFn: async () => {
      const { data, error } = await adminService.getTeacherStudents(teacherId!, programId!);
      if (error) throw error;
      return (data as unknown as TeacherStudentRow[]) ?? [];
    },
    enabled: !!teacherId && !!programId,
  });
}
