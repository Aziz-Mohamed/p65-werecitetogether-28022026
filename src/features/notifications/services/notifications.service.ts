import { supabase } from '@/lib/supabase';
import type { NotificationPreferences } from '../types/notifications.types';

class NotificationsService {
  /**
   * Register a push token for the current user.
   * Uses upsert on the unique token constraint to handle re-registration.
   */
  async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform, is_active: true },
        { onConflict: 'token' },
      );

    if (error) {
      if (__DEV__) {
        console.log('[Notifications] registerToken error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Remove a specific push token (e.g., on logout from current device).
   */
  async removeToken(token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      if (__DEV__) {
        console.log('[Notifications] removeToken error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Remove all push tokens for a user (e.g., account deletion).
   */
  async removeAllUserTokens(userId: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      if (__DEV__) {
        console.log('[Notifications] removeAllUserTokens error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get notification preferences for a user.
   * Returns null if no preferences row exists yet.
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (__DEV__) {
        console.log('[Notifications] getPreferences error:', error.message);
      }
      throw error;
    }

    return data;
  }

  /**
   * Create or update notification preferences for a user.
   * Uses upsert on user_id PK to handle first-time creation.
   */
  async upsertPreferences(
    userId: string,
    prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>,
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: userId, ...prefs },
        { onConflict: 'user_id' },
      );

    if (error) {
      if (__DEV__) {
        console.log('[Notifications] upsertPreferences error:', error.message);
      }
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
