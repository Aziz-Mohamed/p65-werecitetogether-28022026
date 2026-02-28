import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/stores/authStore';
import { authService } from '../services/auth.service';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async () => {
      await authService.signOut();
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
