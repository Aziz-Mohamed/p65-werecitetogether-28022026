import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peerPairingService } from '../services/peer-pairing.service';

export function useAvailablePartners(programId?: string, sectionType?: string, excludeStudentId?: string) {
  return useQuery({
    queryKey: ['peer-available-partners', programId, sectionType, excludeStudentId],
    queryFn: async () => {
      const { data, error } = await peerPairingService.getAvailablePartners(
        programId!,
        sectionType!,
        excludeStudentId!,
      );
      if (error) throw error;
      return data;
    },
    enabled: !!programId && !!sectionType && !!excludeStudentId,
  });
}

export function useTogglePeerAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, available }: { studentId: string; available: boolean }) => {
      const { data, error } = await peerPairingService.togglePeerAvailability(studentId, available);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-available-partners'] });
    },
  });
}
