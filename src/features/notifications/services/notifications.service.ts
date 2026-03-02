import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { NotificationPreference } from '../types/notifications.types';

class NotificationsService {
  async registerPushToken(
    profileId: string,
    expoToken: string,
    platform: 'ios' | 'android',
  ): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          profile_id: profileId,
          token: expoToken,
          platform,
        },
        { onConflict: 'profile_id,token' },
      );

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  }

  async getPreferences(
    profileId: string,
  ): Promise<ServiceResult<NotificationPreference[]>> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }

  async updatePreference(
    profileId: string,
    category: string,
    enabled: boolean,
  ): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          profile_id: profileId,
          category,
          enabled,
        },
        { onConflict: 'profile_id,category' },
      );

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  }

  async removePushToken(
    profileId: string,
    expoToken: string,
  ): Promise<ServiceResult<null>> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('profile_id', profileId)
      .eq('token', expoToken);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  }
}

export const notificationsService = new NotificationsService();
