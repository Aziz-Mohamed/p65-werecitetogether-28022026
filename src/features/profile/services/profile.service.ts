import { supabase } from '@/lib/supabase';
import type { ServiceResult, UserRole } from '@/types/common.types';
import type { Profile, UpdateProfileInput } from '../types/profile.types';

class ProfileService {
  async getProfile(id: string): Promise<ServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async updateProfile(
    id: string,
    input: UpdateProfileInput,
  ): Promise<ServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  }

  async searchProfiles(
    query: string,
    role?: UserRole,
  ): Promise<ServiceResult<Profile[]>> {
    let builder = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (role) {
      builder = builder.eq('role', role);
    }

    const { data, error } = await builder;

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }
}

export const profileService = new ProfileService();
