import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { ReassignStudentParams } from '../types/admin.types';

export function useReassignStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReassignStudentParams) => adminService.reassignStudent(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-teachers'] });
    },
  });
}
