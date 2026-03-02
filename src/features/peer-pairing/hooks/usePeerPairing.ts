import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peerPairingService } from '../services/peer-pairing.service';
import type { RequestPairingInput } from '../types/peer-pairing.types';

export function useActivePairings(studentId?: string, programId?: string) {
  return useQuery({
    queryKey: ['peer-pairings', studentId, programId],
    queryFn: async () => {
      const { data, error } = await peerPairingService.getActivePairings(studentId!, programId!);
      if (error) throw error;
      return data;
    },
    enabled: !!studentId && !!programId,
  });
}

export function usePairingHistory(studentId?: string, programId?: string) {
  return useQuery({
    queryKey: ['peer-pairing-history', studentId, programId],
    queryFn: async () => {
      const { data, error } = await peerPairingService.getPairingHistory(studentId!, programId!);
      if (error) throw error;
      return data;
    },
    enabled: !!studentId && !!programId,
  });
}

export function useRequestPairing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RequestPairingInput) => {
      const { data, error } = await peerPairingService.requestPairing(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-pairings'] });
      queryClient.invalidateQueries({ queryKey: ['peer-available-partners'] });
    },
  });
}

export function useRespondToPairing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pairingId, action }: { pairingId: string; action: 'accept' | 'decline' }) => {
      const { data, error } = await peerPairingService.respondToPairing(pairingId, action);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-pairings'] });
    },
  });
}

export function useCancelPairing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pairingId: string) => {
      const { data, error } = await peerPairingService.cancelPairing(pairingId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-pairings'] });
    },
  });
}

export function useCompletePairing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pairingId: string) => {
      const { data, error } = await peerPairingService.completePairing(pairingId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-pairings'] });
      queryClient.invalidateQueries({ queryKey: ['peer-pairing-history'] });
    },
  });
}
