import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { onboardingService } from '../services/onboarding.service';
import type { OnboardingData } from '../types';

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (data: OnboardingData) =>
      onboardingService.completeOnboarding(data),
    onSuccess: (result) => {
      if (result.data) {
        setProfile(result.data);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        // Root layout's AuthGuard will handle redirect to role-based home
      }
    },
  });
};
