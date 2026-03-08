import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { SupervisedTeacher } from '../types/admin.types';

export function useSupervisedTeachers(supervisorId: string | undefined) {
  return useQuery({
    queryKey: ['supervised-teachers', supervisorId],
    queryFn: async () => {
      const { data, error } = await adminService.getSupervisedTeachers(supervisorId!);
      if (error) throw error;
      return (data as unknown as SupervisedTeacher[]) ?? [];
    },
    enabled: !!supervisorId,
    staleTime: 2 * 60 * 1000,
  });
}
