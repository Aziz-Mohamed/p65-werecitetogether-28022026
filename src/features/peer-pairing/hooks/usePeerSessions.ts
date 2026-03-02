import { useMutation, useQueryClient } from '@tanstack/react-query';
import { peerPairingService } from '../services/peer-pairing.service';

export function useLogPeerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pairingId: string) => {
      const { data, error } = await peerPairingService.logPairingSession(pairingId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-pairings'] });
    },
  });
}
