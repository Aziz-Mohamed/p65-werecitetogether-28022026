import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { Tables } from '@/types/database.types';
import type { OnboardingData } from '../types';

type Profile = Tables<'profiles'>;

class OnboardingService {
  async completeOnboarding(data: OnboardingData): Promise<ServiceResult<Profile>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        display_name: data.fullName,
        gender: data.gender,
        age_range: data.ageRange,
        country: data.country,
        region: data.region ?? null,
        onboarding_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: profile };
  }
}

export const onboardingService = new OnboardingService();
